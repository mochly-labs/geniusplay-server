// eslint-disable-next-line no-undef
if (!process.auth) process.auth = {}
// eslint-disable-next-line no-undef
let auth = process.auth

function setUsername(uuid, username) {
  if (!auth[uuid]) auth[uuid] = {}
  auth[uuid].username = username;
}

function getUsername(uuid) {
  return auth[uuid]?.username;
} 

function removeData(uuid) {
  if (auth[uuid]) delete auth[uuid];
}

function setIp(uuid, ip) {
  if (!auth[uuid]) auth[uuid] = {}
  auth[uuid].ip = ip;
}

function getIp(uuid) {
  return auth[uuid]?.ip;
}

module.exports = { setUsername, getUsername, removeData, setIp, getIp };