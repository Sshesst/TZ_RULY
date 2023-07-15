import fs from "fs";
import { DOMParser } from "xmldom";
import iconv from "iconv-lite";
import AdmZip from "adm-zip";
import fetch from "node-fetch";

async function parseXMLFromURL(url) {
    try {
        const url = "http://www.cbr.ru/s/newbik";
        const response = await fetch(url);
        const zipBuffer = await response.buffer();
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        let xmlEntry;
        for (const entry of zipEntries) {
            if (entry.entryName.endsWith(".xml")) {
                xmlEntry = entry;
                break;
            }
        }

        if (!xmlEntry) {
            throw new Error("XML-файл не найден в архиве.");
        }

        const xmlString = iconv.decode(xmlEntry.getData(), "win1251");

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const entries = xmlDoc.getElementsByTagName("BICDirectoryEntry");
        const result = [];

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const accounts = entry.getElementsByTagName("Accounts");

            if (accounts.length === 0) {
                continue;
            }

            const bic = entry.getAttribute("BIC");
            const nameElement = entry.getElementsByTagName("ParticipantInfo")[0];
            const name = nameElement.getAttribute("NameP");

            result.push({ bic, name });

            for (let j = 0; j < accounts.length; j++) {
                const account = accounts[j];
                const corrAccount = account.getAttribute("Account");

                result.push({ bic, name, corrAccount });
            }
        }

        return result;
    } catch (error) {
        console.error("Ошибка при загрузке и парсинге XML-файла:", error);
        return [];
    }
}

// Тестировал для себя
parseXMLFromURL().then((data) => {
    console.log(data);
});