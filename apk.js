import { horla } from "../lib/horla.js";
import axios from "axios";

export default horla(
  {
    nomCom: "apk",
    aliases: ["app", "playstore"],
    reaction: "🉑",
    categorie: "Download",
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, arg, ms } = commandeOptions;

    try {
      // Check if app name is provided
      const appName = arg.join(" ");
      if (!appName) {
        return repondre("Please provide an app name.");
      }

      // Fetch app search results from the BK9 API
      const searchResponse = await axios.get(
        `https://bk9.fun/search/apk?q=${encodeURIComponent(appName)}`
      );
      const searchData = searchResponse.data;

      // Check if any results were found
      if (!searchData.BK9 || searchData.BK9.length === 0) {
        return repondre("No app found with that name, please try again.");
      }

      // Fetch the APK details for the first result
      const appDetailsResponse = await axios.get(
        `https://bk9.fun/download/apk?id=${searchData.BK9[0].id}`
      );
      const appDetails = appDetailsResponse.data;

      // Check if download link is available
      if (!appDetails.BK9 || !appDetails.BK9.dllink) {
        return repondre("Unable to find the download link for this app.");
      }

      // Send the APK file to the chat
      await zk.sendMessage(
        dest,
        {
          document: { url: appDetails.BK9.dllink },
          fileName: `${appDetails.BK9.name}.apk`,
          mimetype: "application/vnd.android.package-archive",
          caption: "✧ HORLAPOOKIE APK Downloader ✧",
        },
        { quoted: ms }
      );
    } catch (error) {
      console.error("Error during APK download process:", error);
      repondre("APK download failed. Please try again later.");
    }
  }
);
