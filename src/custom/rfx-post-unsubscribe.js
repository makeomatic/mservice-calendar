const admin = require('firebase-admin');

module.exports = function postSubscribe(params, user) {
  const { fcmToken } = params;
  if (fcmToken) {
    const { config } = this;
    const { firebase: { adminCert } } = config;
    const { id } = params;
    const topic = `calendar_evt_${id}`;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(adminCert),
      });
    }
    return admin
      .messaging()
      .unsubscribeFromTopic(fcmToken, topic)
      .then(() => this.log.info(`${user.id} successfully unsubscribed from topic: ${topic}`))
      .catch(error => this.log.warn(`Error unsubscribing from topic: ${topic}`, error));
  }
  return null;
};
