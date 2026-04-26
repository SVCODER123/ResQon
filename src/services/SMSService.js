import * as SMS from 'expo-sms';

export const SMSService = {
  async sendEmergency(contacts, location, userName = 'Someone') {
    if (!contacts?.length) return;

    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      console.warn('SMSService: SMS not available on this device');
      return;
    }

    const mapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    const body = `🚨 EMERGENCY ALERT 🚨\n${userName} has triggered an SOS via ResQon.\nLive location: ${mapsLink}\nPlease call or take action immediately!`;

    const phones = contacts
      .filter(c => c.phone)
      .map(c => c.phone);

    if (!phones.length) return;

    try {
      await SMS.sendSMSAsync(phones, body);
    } catch (e) {
      console.warn('SMSService: failed to send SMS', e);
    }
  },
};
