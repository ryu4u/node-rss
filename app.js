const axios = require("axios");
const cheerio = require("cheerio");

const getPage = async (rss) => {
  try {
    return await axios.get(rss);
  } catch (err) {
    console.log(err);
  }
};

const parsing = async (gubun, page) => {
  const $ = cheerio.load(page, { xmlMode: true });

  let contents = [];

  if (gubun == "NEWS") {
    $("item").each(function () {
      let title = $(this).children("title").text();
      let link = $(this).children("link").text();

      contents.push({
        title: title,
        link: link,
      });
    });
  } else if (gubun == "WEATHER") {
    $("data").each(function () {
      contents.push({
        seq: $(this).attr("seq"),
        hour: $(this).children("hour").text(),
        day: $(this).children("day").text(),
        temp: $(this).children("temp").text(),
        sky: $(this).children("sky").text(),
        pty: $(this).children("pty").text(),
        wfKor: $(this).children("wfKor").text(),
        wfEn: $(this).children("wfEn").text(),
      });
    });
  }

  return contents;
};

const getData = async (gubun, rss) => {
  const xml = await getPage(rss);
  const contents = await parsing(gubun, xml.data);
  console.log(contents);
};

getData("NEWS", "https://www.yonhapnewstv.co.kr/browse/feed/"); // 연합뉴스 TV
getData("WEATHER", "http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=2714065500"); // 기상청 날씨
