// scripts/build_unsplash_thumbnails_and_metadata.js
const fs = require("fs");
const path = require("path");
const https = require("https");
const vm = require("vm");

function buildStyledQueryAndOrientation(slide) {
  const hint = (slide.styleHint || "").toLowerCase();
  const title = (slide.title || "").toLowerCase();
  const kw = (slide.keywords || []).join(" ").toLowerCase();
  const text = title + " " + kw;

  // 기본값
  let orientation = "portrait"; // landscape | portrait | squarish
  let styleTag = "";

  // -------------------------
  // 1) styleHint 우선 분기
  // -------------------------
   if (hint === "zara") {
    orientation = "portrait";
    styleTag =
      "fashion editorial, zara style, minimalist clothing, monochrome outfit, " +
      "studio lighting, soft shadows, neutral tones, modern aesthetic";

  } else if (hint === "celine") {
    orientation = "portrait";
    styleTag =
      "high-fashion editorial, celine style, luxury minimalism, black and white aesthetic, " +
      "strong contrast, clean composition, runway feeling, elegant posture";

  } else if (hint === "cyberpunk") {
  // 네온 시티 / 블루+핑크 / 밤거리
  orientation = "landscape";
  styleTag =
    "cyberpunk city at night, neon lights, rainy street, reflections, " +
    "blue and magenta glow, futuristic, dense signage, cinematic lighting";

  } else if (hint === "skyscraper") {
  // 초고층 빌딩 위주 구도
  orientation = "portrait";
  styleTag =
    "tall modern skyscraper, looking up perspective, glass facade, modern architecture, " +
    "minimal sky, dramatic composition, slightly desaturated, high contrast";

  } else if (hint === "2000s_portrait") {
    orientation = "portrait";
    styleTag =
      "portrait, 2000s aesthetic, film photo, soft lighting, shallow depth of field, grain";
  } else if (hint === "2000s_landscape") {
    orientation = "landscape";
    styleTag =
      "landscape, 2000s aesthetic, film photo, sky, slightly faded colors, grain";
  } else if (hint === "portrait") {
    orientation = "portrait";
    styleTag = "portrait photography, soft light, shallow depth of field";
  } else if (hint === "landscape") {
    orientation = "landscape";
    styleTag = "landscape photography, wide shot, natural light";

  // --- 음식 (Food) ---
  } else if (hint === "food" || hint === "korean_food" || hint === "japanese_food") {
    orientation = "squarish"; // 음식은 정사각/탑뷰 많이 쓰니까
    let cuisine = "";
    if (hint === "korean_food") {
      cuisine = "Korean food, traditional Korean dishes, metal chopsticks";
    } else if (hint === "japanese_food") {
      cuisine = "Japanese food, sushi, ramen, izakaya vibes";
    } else {
      cuisine = "food photography, dishes on table, overhead shot";
    }
    styleTag =
      cuisine +
      ", 2000s aesthetic, film photo, warm colors, shallow depth of field, grain";

  // --- 조각상 / 동상 (Sculpture / Statue) ---
  } else if (hint === "sculpture" || hint === "statue" || hint === "art_sculpture") {
    orientation = "portrait";
    styleTag =
      "sculpture, statue, museum, dramatic lighting, shadows, detailed texture, 2000s film look";

  // --- 일본 (도시 야경 / 2000s 감성) ---
  } else if (
    hint === "japan" ||
    hint === "japan_2000s" ||
    hint === "tokyo" ||
    hint === "japan_city"
  ) {
    orientation = "landscape";
    styleTag =
      "Japanese city street at night, neon signs, 2000s aesthetic, film photo, slight grain, people walking, convenience stores";

  // --- 한국 (서울 / 거리 / 2000s 감성) ---
  } else if (
    hint === "korea" ||
    hint === "korea_2000s" ||
    hint === "seoul" ||
    hint === "korea_city"
  ) {
    orientation = "landscape";
    styleTag =
      "Seoul street at night, Korean signs, alleyway, 2000s digital camera feeling, warm neon lights, slight grain";

  // -------------------------
  // 2) hint 없으면 내용 기반 자동 추론
  // -------------------------
  } else {
    // 음식 관련 키워드
    if (/(food|dish|pizza|burger|noodle|ramen|sushi|restaurant|cafe|dining|meal|밥|음식|라멘|스시|카레|우동|짬뽕|냉면|김치)/.test(
      text
    )) {
      orientation = "squarish";
      styleTag =
        "food photography, overhead shot, table, 2000s aesthetic, warm tones, film, grain";

      // 한식 느낌
      if (/(korea|korean|한식|한국)/.test(text)) {
        styleTag += ", Korean food, side dishes, metal chopsticks";
      }
      // 일본식 느낌
      if (/(japan|japanese|일본|도쿄|라멘|스시)/.test(text)) {
        styleTag += ", Japanese food, ramen, sushi bar";
      }

    // 조각상/동상
    } else if (/(sculpture|statue|monument|artwork|museum|조각|동상|조형물)/.test(text)) {
      orientation = "portrait";
      styleTag =
        "sculpture, statue in museum, dramatic side lighting, detailed texture, 2000s film";

    // 일본 도시 / 거리
    } else if (/(japan|japanese|tokyo|osaka|kyoto|일본|도쿄|오사카|교토)/.test(text)) {
      orientation = "landscape";
      styleTag =
        "Japanese city street, neon lights, narrow alley, 2000s film aesthetic, grain";

    // 한국 도시 / 서울
    } else if (/(korea|korean|seoul|busan|incheon|한국|서울|부산|인천)/.test(text)) {
      orientation = "landscape";
      styleTag =
        "Seoul city street, Korean signs, night street scene, 2000s aesthetic, slightly desaturated, grain";
    } 
    else if (
      /person|people|human|face|portrait|interview|speaker|talk|강연|발표|인터뷰|인물/.test(
        text
      )
    ) {
      orientation = "portrait";
      styleTag =
        "portrait, 2000s film, soft lighting, shallow depth of field, subject centered";
      
    // 기본: 풍경 + 2000s
    } else {
      orientation = "landscape";
      styleTag =
        "landscape, 2000s aesthetic, film photo, subtle grain, nostalgic, sky or cityscape";
    }
  }

  // -------------------------
  // 3) base query + styleTag 합치기
  // -------------------------
  const base =
    slide.keywords && slide.keywords.length > 0
      ? slide.keywords.join(" ")
      : slide.title || "";

  const query =
    (base + " " + styleTag).trim() || "2000s film aesthetic, nostalgic";

  return { query, orientation };
}


// =====================
// 0. metadata.js에서 window.imageData 읽어오기
// =====================
function loadSlidesFromMetadata() {
  const metadataPath = path.join(__dirname, "..", "metadata.js");
  const code = fs.readFileSync(metadataPath, "utf8");

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  const slides = sandbox.window.imageData;
  if (!Array.isArray(slides)) {
    throw new Error("metadata.js 안의 window.imageData 가 배열이 아닙니다.");
  }
  return slides;
}

let slides;
try {
  slides = loadSlidesFromMetadata();
} catch (e) {
  console.error("❌ metadata.js 로드 실패:", e.message);
  process.exit(1);
}

// =====================
// 1. 환경변수
// =====================
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!UNSPLASH_ACCESS_KEY) {
  console.error("❌ 환경변수 UNSPLASH_ACCESS_KEY 를 설정해주세요.");
  process.exit(1);
}

// =====================
// 2. https GET 유틸 (텍스트 / JSON / 버퍼)
// =====================
function httpGetText(url, maxRedirects, cb) {
  if (typeof maxRedirects === "function") {
    cb = maxRedirects;
    maxRedirects = 3;
  }
  if (maxRedirects <= 0) {
    return cb(new Error("리다이렉트 너무 많음"));
  }

  https
    .get(url, function (res) {
      const status = res.statusCode;
      const location = res.headers.location;

      if (status >= 300 && status < 400 && location) {
        const redirectedUrl = location.startsWith("http")
          ? location
          : new URL(location, url).toString();
        return httpGetText(redirectedUrl, maxRedirects - 1, cb);
      }

      if (status < 200 || status >= 300) {
        res.resume();
        return cb(new Error("HTTP " + status + " for " + url));
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        data += chunk;
      });
      res.on("end", function () {
        cb(null, data);
      });
    })
    .on("error", function (err) {
      cb(err);
    });
}

function httpGetJson(url, cb) {
  httpGetText(url, function (err, text) {
    if (err) return cb(err);
    try {
      const json = JSON.parse(text);
      cb(null, json);
    } catch (e) {
      cb(e);
    }
  });
}

function httpGetBuffer(url, maxRedirects, cb) {
  if (typeof maxRedirects === "function") {
    cb = maxRedirects;
    maxRedirects = 3;
  }
  if (maxRedirects <= 0) {
    return cb(new Error("리다이렉트 너무 많음"));
  }

  https
    .get(url, function (res) {
      const status = res.statusCode;
      const location = res.headers.location;

      if (status >= 300 && status < 400 && location) {
        const redirectedUrl = location.startsWith("http")
          ? location
          : new URL(location, url).toString();
        return httpGetBuffer(redirectedUrl, maxRedirects - 1, cb);
      }

      if (status < 200 || status >= 300) {
        res.resume();
        return cb(new Error("HTTP " + status + " for " + url));
      }

      const chunks = [];
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", function () {
        const buffer = Buffer.concat(chunks);
        cb(null, buffer);
      });
    })
    .on("error", function (err) {
      cb(err);
    });
}

// =====================
// 3. Unsplash 유틸
// =====================

// 경로의 마지막 세그먼트를 id/slug로 사용 (하이픈 자르지 않음)
function extractUnsplashId(sourceURL) {
  const decoded = decodeURIComponent(sourceURL);
  const pathOnly = decoded.split("?")[0];
  const segments = pathOnly.split("/").filter(Boolean);
  const lastPart = segments[segments.length - 1];
  return lastPart;
}

// 랜덤 + fallback
function fetchRandomUnsplashPhotoWithFallback(query, orientation, cb) {
  const baseUrl = "https://api.unsplash.com/photos/random";
  const url1 =
    baseUrl +
    "?client_id=" +
    encodeURIComponent(UNSPLASH_ACCESS_KEY) +
    "&query=" +
    encodeURIComponent(query) +
    "&orientation=" +
    encodeURIComponent(orientation || "hamburger");
  console.log(url1);
  httpGetJson(url1, function (err, json) {
    if (!err && json && json.urls && json.urls.small) {
      return cb(null, json);
    }

    const fallbackQuery = "hamburger";
    const url2 =
      baseUrl +
      "?client_id=" +
      encodeURIComponent(UNSPLASH_ACCESS_KEY) +
      "&query=" +
      encodeURIComponent(fallbackQuery) +
      "&orientation=" +
      encodeURIComponent(orientation || "hamburger");

    httpGetJson(url2, function (err2, json2) {
      if (!err2 && json2 && json2.urls && json2.urls.small) {
        return cb(null, json2);
      }
      cb(err2 || err || new Error("랜덤 이미지 가져오기 실패"));
    });
  });
}

function fetchPhotoById(photoId, cb) {
  const url =
    "https://api.unsplash.com/photos/" +
    encodeURIComponent(photoId) +
    "?client_id=" +
    encodeURIComponent(UNSPLASH_ACCESS_KEY);

  httpGetJson(url, cb);
}

function slugify(str) {
  return String(str || "slide")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "slide";
}

// =====================
// 4. 개별 슬라이드 처리
// =====================
function resolveSlide(slide, cb) {

  if (slide.filename) {
    const outPath = path.join(process.cwd(), slide.filename);
    if (fs.existsSync(outPath)) {
      // 아무 API 호출도 안 하고, 로그도 안 찍고, 원본 슬라이드 그대로 넘김
      return cb(null, slide);
    }
  }

  function afterPhotoMeta(err, photo) {
    if (err || !photo || !photo.urls || !photo.urls.small) {
      console.error("❌ Unsplash 메타 실패:", slide.title, err && err.message);
      return cb(null, slide); // 실패해도 원본 슬라이드는 유지
    }

    const photoId = photo.id || "unsplash";
    const baseSlug = slugify(slide.title || "slide");

    const finalFilename =
      slide.filename ||
      path.join("thumbnail", baseSlug + "-" + photoId + ".jpg");

    const finalSourceURL =
      (photo.links && photo.links.html) || slide.sourceURL;

    const outPath = path.join(process.cwd(), finalFilename);

    function finishWithMeta(saved) {
      const newSlide = Object.assign({}, slide, {
        filename: finalFilename,
        sourceURL: finalSourceURL
      });
      if (saved) {
        // ✅ 최종 썸네일 저장 성공 로그만 찍기
        console.log("✅", slide.title, "→", finalFilename);
      }
      cb(null, newSlide);
    }

    // 파일이 이미 있으면 다운로드 스킵, 로그도 안 찍고 메타만 업데이트
    if (fs.existsSync(outPath)) {
      return finishWithMeta(false);
    }

    let imageUrl = photo.urls.small + "&q=70&w=800&auto=format";

    httpGetBuffer(imageUrl, function (err2, buffer) {
      if (err2) {
        console.error("❌ 이미지 다운로드 실패:", slide.title, err2.message);
        return finishWithMeta(false);
      }

      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFile(outPath, buffer, function (err3) {
        if (err3) {
          console.error("❌ 파일 저장 실패:", slide.title, err3.message);
          return finishWithMeta(false);
        }
        finishWithMeta(true);
      });
    });
  }

  // 고정 Unsplash URL인 경우
  if (slide.sourceURL && slide.sourceURL.indexOf("https://unsplash.com") === 0) {
    const photoId = extractUnsplashId(slide.sourceURL);
    fetchPhotoById(photoId, afterPhotoMeta);
  } else {
    // 🎨 랜덤 모드 + 스타일 감성
    const qo = buildStyledQueryAndOrientation(slide);
    fetchRandomUnsplashPhotoWithFallback(qo.query, qo.orientation, afterPhotoMeta);
  }
}

// =====================
// 5. 전체 슬라이드 처리 + metadata.generated.js 생성 후 metadata.js 덮어쓰기
// =====================
function main() {
  const resolvedSlides = [];
  let idx = 0;

  function next() {
    if (idx >= slides.length) {
      const outCode =
        "window.imageData = " +
        JSON.stringify(resolvedSlides, null, 2) +
        ";\n";

      const generatedPath = path.join(process.cwd(), "metadata.generated.js");
      const metadataPath = path.join(process.cwd(), "metadata.js");

      // metadata.generated.js 생성
      fs.writeFileSync(generatedPath, outCode, "utf8");
      // metadata.js 덮어쓰기
      fs.writeFileSync(metadataPath, outCode, "utf8");

      console.log("🎉 metadata.generated.js 생성 및 metadata.js 갱신 완료");
      return;
    }

    const slide = slides[idx++];
    resolveSlide(slide, function (err, newSlide) {
      if (err) {
        console.error("❌ 슬라이드 처리 중 에러:", slide.title, err.message);
        resolvedSlides.push(slide);
      } else {
        resolvedSlides.push(newSlide);
      }
      next();
    });
  }

  next();
}

main();
