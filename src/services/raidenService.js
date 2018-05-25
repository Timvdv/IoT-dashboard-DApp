export default class RaidenService {
  constructor() {
    this.api_location = "http://raiden.timvandevathorst.nl";
  }

  getChannelInfo(channel) {
    return fetch(`${this.api_location}/api/1/channels/${channel}`, {
      method: "get"
    })
      .then(response => response.text())
      .then(text => {
        // @TODO: This should be fixed in the API, return correct response as JSON. Not string
        let json = JSON.parse(JSON.parse(text));

        if (json.error === 404) {
          throw new Error("No channels found.");
        }

        return json;
      })
      .catch(error => {
        this.errorToJson(error);
      });
  }

  errorToJson(error) {
    return {
      success: false,
      error: error.message
    };
  }
}
