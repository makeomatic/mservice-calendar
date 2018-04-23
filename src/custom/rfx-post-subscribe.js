const admin = require('firebase-admin');

module.exports = function postSubscribe(params, user) {
  const { fcmToken } = params;
  if (fcmToken) {
    const { config } = this;
    const { firebase: { adminCert } } = config;
    const { id } = params;
    const topic = `calendar_evt_${id}`;
    admin.initializeApp({
      credential: admin.credential.cert(adminCert),
    });
    admin.messaging()
      .subscribeToTopic(fcmToken, topic)
      .then(() => this.log(`${user.id} successfully subscribed to topic: ${topic}`))
      .catch(error => this.log(`Error subscribing from topic: ${topic}`, error));
  }
};
