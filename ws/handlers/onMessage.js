const { connectToDB } = require("../utils/db");
const bcrypt = require("bcrypt");
const auth = require("../utils/auth.js");
const crypto = require("crypto");
const { verifyTurnstileToken } = require("../utils/turnstile");

const saltRounds = 10;

async function onMessage(ws, uuid, msg) {
  let data;
  try {
    data = JSON.parse(msg);
  } catch {
    return ws.send(
      JSON.stringify({ type: "error", error: "Invalid JSON format" })
    );
  }

  const db = await connectToDB();
  const users = db.collection("users");
  const institutions = db.collection("institutions");

  if (data.type === "register") {
    const { name, username, email, password, turnstileToken } = data;
    if (!name || !username || !email || !password) {
      return ws.send(
        JSON.stringify({
          type: "register",
          success: false,
          error: "Missing fields",
        })
      );
    }
    if (!turnstileToken) {
      return ws.send(
        JSON.stringify({
          type: "register",
          success: false,
          error: "Missing turnstile token",
        })
      );
    }

     
    const turnstile = await verifyTurnstileToken(
      turnstileToken,
      // eslint-disable-next-line no-undef
      process.env.PRODUCTION
        ? // eslint-disable-next-line no-undef
          process.env.TURNSTILE_SECRET
        : "1x0000000000000000000000000000000AA",
      auth.getIp(uuid)
    );

    if (!turnstile.success) {
      return ws.send(
        JSON.stringify({
          type: "register",
          success: false,
          error: "Invalid turnstile token",
        })
      );
    }

    const exists = await users.findOne({
      $or: [{ email }, { username }],
    });
    if (exists) {
      return ws.send(
        JSON.stringify({
          type: "register",
          success: false,
          error: "Email or username already in use",
        })
      );
    }

    const hash = await bcrypt.hash(password, saltRounds);

    const lastUser = await users.find().sort({ id: -1 }).limit(1).next();
    const newId = lastUser ? lastUser.id + 1 : 1;
    const newUser = {
      id: newId,
      name,
      username,
      email,
      password: hash,
      institution: null,
      registered: Math.floor(Date.now() / 1000),
    };

    await users.insertOne(newUser);

    auth.setUsername(uuid, newUser.username);
    return ws.send(
      JSON.stringify({
        type: "register",
        success: true,
        user: { id: newUser.id, name, username, email },
      })
    );
  }

  if (data.type === "auth") {
    const { username, password } = data;
    if (!username || !password) {
      return ws.send(
        JSON.stringify({
          type: "auth",
          success: false,
          error: "Missing credentials",
        })
      );
    }

    const user = await users.findOne({ username });
    if (!user) {
      return ws.send(
        JSON.stringify({
          type: "auth",
          success: false,
          error: "User not found",
        })
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return ws.send(
        JSON.stringify({
          success: false,
          type: "auth",
          error: "Invalid password",
        })
      );
    }

    auth.setUsername(uuid, user.username);
    let institution = await institutions.findOne({ id: user.institution });
    let institutionName = institution ? institution.full_name : "None";
    let institutionShortname = institution ? institution.short_name : "None";
    console.log("Debug:", institution);
    ws.send(
      JSON.stringify({
        success: true,
        type: "auth",
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          institution: user.institution,
          registered: user.registered,
          institutionName,
          institutionShortname,
        },
      })
    );
  }

  if (data.type === "set-institution") {
    const { institution } = data;

    if (!institution) {
      return ws.send(
        JSON.stringify({
          type: "set-institution",
          success: false,
          error: "Missing fields",
        })
      );
    }

    const user = await users.findOne({ username: auth.getUsername(uuid) });
    if (!user) {
      return ws.send(
        JSON.stringify({
          type: "set-institution",
          success: false,
          error: "User not found",
          username: auth.getUsername(uuid),
        })
      );
    }

    if (institution === "none") {
      if (user.institution) {
        const inst = await institutions.findOne({ id: user.institution });

        if (inst?.admin === user.id) {
          await institutions.deleteOne({ id: user.institution });
          await users.updateMany(
            { institution: user.institution },
            { $set: { institution: null } }
          );
        }
      }
      return ws.send(
        JSON.stringify({
          type: "set-institution",
          success: true,
          institution: null,
        })
      );
    }

    const newInstitution = await institutions.findOne({
      invite_code: crypto
        .createHash("sha256")
        .update(institution)
        .digest("hex"),
    });
    if (!newInstitution) {
      return ws.send(
        JSON.stringify({
          type: "set-institution",
          success: false,
          error: "Invalid institution token",
        })
      );
    }
    console.log(institution);

    await users.updateOne(
      { username: auth.getUsername(uuid) },
      { $set: { institution: newInstitution.id } }
    );

    return ws.send(
      JSON.stringify({
        type: "set-institution",
        success: true,
        institution: newInstitution ? newInstitution.id : "none",
      })
    );
  }

  if (data.type === "create-institution") {
    const { full_name, short_name, invite } = data;

    if (!full_name || !short_name || !invite) {
      return ws.send(
        JSON.stringify({
          type: "create-institution",
          success: false,
          error: "Missing fields",
        })
      );
    }

    const user = await users.findOne({ username: auth.getUsername(uuid) });
    if (!user) {
      return ws.send(
        JSON.stringify({
          type: "create-institution",
          success: false,
          error: "User not found",
        })
      );
    }

    const exists = await institutions.findOne({ short_name });
    if (exists) {
      return ws.send(
        JSON.stringify({
          type: "create-institution",
          success: false,
          error: "Short name already in use",
        })
      );
    }

    const lastInst = await institutions.find().sort({ id: -1 }).limit(1).next();
    const newInstId = lastInst ? lastInst.id + 1 : 1;

    const invite_code = crypto
      .createHash("sha512")
      .update(`${short_name}-${invite}`)
      .digest("hex");

    const newInstitution = {
      id: newInstId,
      full_name,
      short_name,
      invite_code,
      admin: user.id,
    };

    await institutions.insertOne(newInstitution);
    await users.updateOne(
      { username: user.username },
      { $set: { institution: newInstId } }
    );

    return ws.send(
      JSON.stringify({
        type: "create-institution",
        success: true,
        invite: `${short_name}-${invite}`,
      })
    );
  }
}

module.exports = { onMessage };
