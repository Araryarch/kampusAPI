import { serve } from "bun";
import axios from "axios";
import * as cheerio from "cheerio";

const scrapeWebsite = async (url: string) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const tableData: string[][] = [];

    $("table").each((_, table) => {
      $(table)
        .find("tr")
        .each((rowIndex, row) => {
          if (rowIndex === 0) return;
          const rowData: string[] = [];
          $(row)
            .find("th, td")
            .each((_, cell) => {
              rowData.push($(cell).text().trim());
            });
          tableData.push(rowData);
        });
    });

    return tableData;
  } catch (error) {
    console.error("Error scraping website:", error);
    throw new Error("Error scraping website");
  }
};

serve({
  fetch(req) {
    const url = new URL(req.url);
    const queryUrl = url.searchParams.get("url");

    if (!queryUrl) {
      return new Response(
        JSON.stringify({ error: "URL parameter is required" }),
        { status: 400 }
      );
    }

    return scrapeWebsite(queryUrl)
      .then((data) => {
        return new Response(JSON.stringify({ data }), {
          headers: { "Content-Type": "application/json" }
        });
      })
      .catch((error) => {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      });
  },
  port: 3000
});

console.log("server running bro");
