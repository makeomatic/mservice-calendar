const admin = require('firebase-admin');

module.exports = function postSubscribe(params, user) {
  const { fcmToken } = params;
  if (fcmToken) {
    const { config } = this;
    const { firebase: { adminCert, messaging: { topic: { eventPrefix } } } } = config;
    const { id } = params;
    const topic = `${eventPrefix}${id}`;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(adminCert),
      });
    }
    return admin
      .messaging()
      .subscribeToTopic(fcmToken, topic)
      .then(() => this.log.info(`${user.id} successfully subscribed to topic: ${topic}`))
      .catch(error => this.log.warn(`Error subscribing from topic: ${topic}`, error));
  }
  return null;
};
