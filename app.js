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
  } else if (gubun == "WEATHER2") {
    /*
    예보일자 : fcstDate
    에보시간 : fcstTime
    데이터 : fcstValue
    카테고리
      최저기온 : TMN
      최고기온 : TMX
      하늘상태 : SKY - 맑음(1), 구름많음(3), 흐림(4)
      강수형태 : PTY - 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4)
      습도 : REH (%)
      강수확률 : POP (%)
    */

    let day1 = { fcstDate: today() };
    let day2 = { fcstDate: today(1) };

    $("item").each(function () {
      let category = $(this).children("category").text();
      let fcstDate = $(this).children("fcstDate").text();
      let fcstTime = $(this).children("fcstTime").text();
      let fcstValue = $(this).children("fcstValue").text();

      if (category == "TMN") {
        // 최저기온
        if (day1.fcstDate == fcstDate) {
          day1.tmn = fcstValue;
        }

        if (day2.fcstDate == fcstDate) {
          day2.tmn = fcstValue;
        }
      }

      if (category == "TMX") {
        // 최대기온
        if (day1.fcstDate == fcstDate) {
          day1.tmx = fcstValue;
        }

        if (day2.fcstDate == fcstDate) {
          day2.tmx = fcstValue;
        }
      }

      if (category == "SKY") {
        // 하늘상태 : SKY - 맑음(1), 구름많음(3), 흐림(4)
        if (day1.fcstDate == fcstDate && fcstTime == "0900") {
          day1.sky = fcstValue;
        }

        if (day2.fcstDate == fcstDate && fcstTime == "0900") {
          day2.sky = fcstValue;
        }
      }

      if (category == "PTY" && fcstTime == "0900") {
        // 강수형태 : PTY - 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4)
        if (day1.fcstDate == fcstDate) {
          day1.pty = fcstValue;
        }

        if (day2.fcstDate == fcstDate && fcstTime == "0900") {
          day2.pty = fcstValue;
        }
      }
    });
    contents.push(day1);
    contents.push(day2);
  }

  return contents;
};

const getData = async (gubun, rss) => {
  const xml = await getPage(rss);
  const contents = await parsing(gubun, xml.data);
  console.log(contents);
};

const today = (val) => {
  let date = new Date();

  if (val == -1) {
    date = new Date(date.setDate(date.getDate() - 1));
  } else if (val == 1) {
    date = new Date(date.setDate(date.getDate() + 1));
  }

  let year = date.getFullYear();
  let month = ("0" + (1 + date.getMonth())).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);

  return year + month + day;
};

const kmaKey =
  "3EaEE4T1hyQ2WYnXG0ROrvrXwtsDQvlz1%2Bo5aTqOppK9UNzOYBcHtS1ZzakN52lpdcJ%2Fw0B6%2B%2BTggqumd6A2bw%3D%3D";
const kmaDay = today(-1);
const kmaTime = "2300";
//getData("NEWS", "https://www.yonhapnewstv.co.kr/browse/feed/"); // 연합뉴스 TV
//getData("WEATHER", "http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=2711064000"); // 기상청 날씨
getData(
  "WEATHER2",
  "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=" +
    kmaKey +
    "&numOfRows=1000&pageNo=1&base_date=" +
    kmaDay +
    "&base_time=" +
    kmaTime +
    "&nx=89&ny=90"
); // 기상청 단기예보
