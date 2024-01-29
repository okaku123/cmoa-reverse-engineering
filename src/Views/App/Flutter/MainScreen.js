/**
虽然图片下载地址能被获得，但是图片切片有做像素冗余，很难做切片组合重新实施
搁置 搁置 搁置



*/

import {
  useState,
  useEffect,
  useRef,
  createRef,
  useContext,
  useReducer,
} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "./main.css";
import { nanoid } from "nanoid";
import lodash from "lodash";
import Header from "./Header";
import { useLocation } from "react-router";
import Phase1Screen from "./Phase1Screen";

// 1551 × 2164 realfile
// 1487\" orgheight=\"2100 show

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const imgUrl = "./sbcGetImg1.jpg";

function imgLoad(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}

export default function MainScreen(props) {
  const location = useLocation();
  const clipCoordinate = location.state.clipCoordinate;
  const imgSize = location.state.imgSize;

  const calcHeight = 3;

  const [progress, setProgress] = useState(3);

  const [mainImg, setMainImg] = useState(null);
  const [tempClipImgs, setClipImgs] = useState([]);
  const clipImgsRef = useRef();
  const unClipedBottomImagesRef = useRef();
  const [searchLoadingbottomClip, setSearchLoadingbottomClip] = useState(false);
  const bottomClipIndexsRef = useRef();

  const [currentSelectedClipImg, setCurrentSelectedClipImg] = useState(null);
  //顶部可能匹配的切片
  const [candidateClipImgs, setCandidateClipImgs] = useState([]);
  //底部可能匹配的切片
  const [candidateBottomClipImgs, setCandidateBottomClipImgs] = useState([]);

  const [unConfirmClipImgs, setUnConfirmClipImgs] = useState([]);
  /**
   * 已经确认的切片 初级
   */
  const [confirmClipImgs, setConfirmClipImgs] = useState([]);

  const [currentPage, setCurrentPage] = useState("0");

  const [currentSelectedPair, setCurrentSelectedPair] = useState(null);
  const [candidateLeftClipImgs, setCandidateLeftClipImgs] = useState([]);
  const [candidateRightClipImgs, setCandidateRightClipImgs] = useState([]);

  const [confirmLargeClipImgs, setConfirmLargeClipImgs] = useState([]);
  const [_clipCoordinate, setClipCoordinate] = useState(null);

  useEffect(() => {
    const { width, height } = imgSize;
    console.log(width, height);
    const { horizontal, vertical } = clipCoordinate;
    //将切割坐标处理为canvas切割用的偏移量
    let temp = [];
    for (let i = 0; i < 8; i++) {
      const H = horizontal[i];
      let nextH;
      if (i == 7) {
        nextH = height;
      } else {
        nextH = horizontal[i + 1];
      }
      for (let j = 0; j < 8; j++) {
        const W = vertical[j];
        let nextW;
        if (j == 7) {
          nextW = width;
        } else {
          nextW = vertical[j + 1];
        }

        const offsetX = W;
        const offsetY = H;
        const clipWidth = nextW - W;
        const clipHeight = nextH - H;

        temp.push({ offsetX, offsetY, clipWidth, clipHeight });
      }
    }

    setClipCoordinate(temp);
    console.log(temp);
  }, [clipCoordinate, imgSize]);

  useEffect(() => {
    if (!!_clipCoordinate) {
      (async () => {
        await delay(1000 * 1);
        await prepareImgClips2();
      })();
    }
  }, [_clipCoordinate]);

  /**
   * 搜索符合目标切片顶部的三张候选切片
   * @param {ClipImg} currentSelectedClipImg
   */
  async function searchCandidateClipImgs(currentSelectedClipImg) {
    let clipImgsCopy = Array.from(tempClipImgs);
    clipImgsCopy = clipImgsCopy.filter((item) => {
      return !currentSelectedClipImg.mismatchTopArrary.includes(item.id);
    });
    //过滤已经确定底部的切片
    clipImgsCopy = clipImgsCopy.filter((item) => {
      return !item.confirm.b;
    });

    const currentSelectedClipImgIndex = clipImgsCopy.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    clipImgsCopy.splice(currentSelectedClipImgIndex, 1);
    let clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.b);
    let { index: indexofEntropys, closestNumber } = findClosestNumber(
      clipImgsCopyEntropys,
      currentSelectedClipImg.entropy.t,
    );
    const firstCandidateClipImgID = clipImgsCopy[indexofEntropys].id;
    const firstCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == firstCandidateClipImgID,
    );

    clipImgsCopy.splice(indexofEntropys, 1);
    clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.b);
    let { index: indexofEntropysNear, closestNumberNear } = findClosestNumber(
      clipImgsCopyEntropys,
      currentSelectedClipImg.entropy.t,
    );
    const secondCandidateClipImgID = clipImgsCopy[indexofEntropysNear].id;
    const secondCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == secondCandidateClipImgID,
    );

    clipImgsCopy.splice(indexofEntropysNear, 1);
    clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.b);
    let { index: indexofEntropysNearNear, closestNumberNearNear } =
      findClosestNumber(clipImgsCopyEntropys, currentSelectedClipImg.entropy.t);
    const thirdCandidateClipImgID = clipImgsCopy[indexofEntropysNearNear].id;
    const thirdCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == thirdCandidateClipImgID,
    );

    let candidateClipImgs = [];
    candidateClipImgs.push(secondCandidateClipImg);
    candidateClipImgs.push(firstCandidateClipImg);
    candidateClipImgs.push(thirdCandidateClipImg);

    setCandidateClipImgs(candidateClipImgs);
  }

  /**
   * 搜索符合目标切片底部的三张候选切片
   * @param {ClipImg} currentSelectedClipImg
   */
  async function searchCandidateBottomClipImgs(currentSelectedClipImg) {
    let clipImgsCopy = Array.from(tempClipImgs);
    clipImgsCopy = clipImgsCopy.filter((item) => {
      return !currentSelectedClipImg.mismatchBottomArrary.includes(item.id);
    });
    //过滤已经确定顶部的切片
    clipImgsCopy = clipImgsCopy.filter((item) => {
      return !item.confirm.t;
    });

    const currentSelectedClipImgIndex = clipImgsCopy.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    clipImgsCopy.splice(currentSelectedClipImgIndex, 1);

    let clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.t);
    let { index: indexofEntropys, closestNumber } = findClosestNumber(
      clipImgsCopyEntropys,
      currentSelectedClipImg.entropy.b,
    );
    const firstCandidateClipImgID = clipImgsCopy[indexofEntropys].id;
    const firstCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == firstCandidateClipImgID,
    );

    clipImgsCopy.splice(indexofEntropys, 1);
    clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.t);
    let { index: indexofEntropysNear, closestNumberNear } = findClosestNumber(
      clipImgsCopyEntropys,
      currentSelectedClipImg.entropy.b,
    );
    const secondCandidateClipImgID = clipImgsCopy[indexofEntropysNear].id;
    const secondCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == secondCandidateClipImgID,
    );

    clipImgsCopy.splice(indexofEntropysNear, 1);
    clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.t);
    let { index: indexofEntropysNearNear, closestNumberNearNear } =
      findClosestNumber(clipImgsCopyEntropys, currentSelectedClipImg.entropy.b);
    const thirdCandidateClipImgID = clipImgsCopy[indexofEntropysNearNear].id;
    const thirdCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == thirdCandidateClipImgID,
    );

    let candidateClipImgs = [];

    candidateClipImgs.push(firstCandidateClipImg);
    candidateClipImgs.push(secondCandidateClipImg);
    candidateClipImgs.push(thirdCandidateClipImg);

    setCandidateBottomClipImgs(candidateClipImgs);
  }

  useEffect(() => {
    if (currentSelectedClipImg) {
      searchCandidateClipImgs(currentSelectedClipImg);
      searchCandidateBottomClipImgs(currentSelectedClipImg);
    }
  }, [currentSelectedClipImg]);

  //重新搜索底部一排的切片,排除掉已经被选中的切片
  async function searchBottomClip() {
    setSearchLoadingbottomClip(true);

    let unConfirmClipImgs = Array.from(clipImgsRef.current);
    let unClipedBottomImages = Array.from(unClipedBottomImagesRef.current);
    //过滤掉已经确认的切片
    unConfirmClipImgs = unConfirmClipImgs.filter((item) => !item.confirm);
    //排除掉确认不匹配的切片
    unConfirmClipImgs = unConfirmClipImgs.filter((item) => !item.mismatch);
    //

    let searchedClipIds = [];
    let index = 0;
    for (let unClipedBottomImage of unClipedBottomImages) {
      const itemPostion = `1-${index}`;

      const _unConfirmClipImgs = unConfirmClipImgs.filter((item) => {
        let filter = true;
        if (item.mismatchArrary.length > 0) {
          if (
            ~item.mismatchArrary.findIndex(
              (mismatchItem) => mismatchItem == itemPostion,
            )
          ) {
            filter = false;
          }
        }
        return filter;
      });

      let unConfirmClipImgsBottomEntropys = _unConfirmClipImgs.map((item) => {
        const { id, entropy } = item;
        return { id, entropy: entropy.b };
      });

      if (unClipedBottomImage.clip && unClipedBottomImage.clip.confirm) {
        searchedClipIds.push(unClipedBottomImage.clip.id);
      } else {
        const unClipedBottomImageEntropy = unClipedBottomImage.entropy; // 顶部切片顶部的的熵
        const entropys = unConfirmClipImgsBottomEntropys.map(
          (item) => item.entropy,
        ); //没有确定的切片的所有的底部熵
        let { index: indexofEntropys, closestNumber } = findClosestNumber(
          entropys,
          unClipedBottomImageEntropy,
        );
        let id = unConfirmClipImgsBottomEntropys[indexofEntropys].id; //熵最接近的切片的id
        searchedClipIds.push(id);
      }
      index += 1;
    }

    let bottomClipIndexs = [];
    for (const searchedClipId of searchedClipIds) {
      const unConfirmClipImg = clipImgsRef.current.find(
        (item) => item.id == searchedClipId,
      );
      bottomClipIndexs.push(unConfirmClipImg);
    }

    // setBottomClipIndexs(bottomClipIndexs)
    bottomClipIndexsRef.current = bottomClipIndexs;

    await delay(200);
    setSearchLoadingbottomClip(false);
  }

  async function getImgClipTopPartEntropy(preImgClip) {
    const { url } = preImgClip;
    const img0 = await imgLoad(url);
    var blockCanvas = document.createElement("canvas");
    var blockCtx = blockCanvas.getContext("2d");
    var blockWidth = 264;
    var blockHeight = 368;
    //把切片画出来
    blockCtx.drawImage(
      img0,
      0,
      0,
      blockWidth,
      blockHeight,
      0,
      0,
      blockWidth,
      blockHeight,
    );
    //获取已经找到的切片的顶部像素 宽 266px 高3px
    var imageData = blockCtx.getImageData(0, 0, blockWidth, calcHeight);
    var entropy = calculateEntropy(imageData.data);
    return entropy;
  }

  // async function prepareImgClips() {
  //     const img0 = await imgLoad(imgUrl)
  //     setMainImg(imgUrl)

  //     let clipWidth = 142
  //     let clipHeight = 1667 / 8

  //     console.log(clipWidth, clipHeight)

  //     var canvas = document.createElement('canvas');
  //     var ctx = canvas.getContext('2d');

  //     console.log(img0.width, img0.height)
  //     console.log(
  //         Math.floor(img0.width / 8 - 8),
  //         Math.floor(img0.height / 8 - 8))

  //     // canvas.width = img0.width;
  //     // canvas.height = img0.height;
  //     canvas.width = 1199
  //     canvas.height = 1667

  //     ctx.drawImage(img0, 0, 0);

  //     var blockWidth = clipWidth
  //     var blockHeight = clipHeight
  //     var rows = 8
  //     var cols = 8

  //     let clipImgs = []
  //     let index = 0
  //     for (var row = 0; row < rows; row++) {
  //         for (var col = 0; col < cols; col++) {
  //             const id = nanoid()
  //             // 计算当前小块的起始坐标
  //             var startX = col * blockWidth + offsetX;
  //             var startY = row * blockHeight + offsetY;
  //             console.log(startX, startY, blockHeight)

  //             // 创建一个新的Canvas元素用于存储裁剪后的小块
  //             var blockCanvas = document.createElement('canvas');
  //             var blockCtx = blockCanvas.getContext('2d');

  //             // 设置小块Canvas的宽高
  //             blockCanvas.width = blockWidth;
  //             blockCanvas.height = blockHeight;

  //             // 将裁剪后的小块绘制到小块Canvas上
  //             blockCtx.drawImage(img0, startX, startY, blockWidth, blockHeight, 0, 0, blockWidth, blockHeight);
  //             var imageData_b = blockCtx.getImageData(0, blockHeight - calcHeight, blockWidth, calcHeight);
  //             var entropy_b = calculateEntropy(imageData_b.data);

  //             var imageData_t = blockCtx.getImageData(0, 0, blockWidth, calcHeight);
  //             var entropy_t = calculateEntropy(imageData_t.data);

  //             var imageData_l = blockCtx.getImageData(0, 0, calcHeight, blockHeight);
  //             var entropy_l = calculateEntropy(imageData_l.data);

  //             var imageData_r = blockCtx.getImageData(0, blockWidth - calcHeight, calcHeight, blockHeight);
  //             var entropy_r = calculateEntropy(imageData_r.data);

  //             // 将小块Canvas转换为DataURL或进行其他操作
  //             var blockDataURL = blockCanvas.toDataURL();

  //             let confirm = false
  //             if (!!clipImgsRef.current && clipImgsRef.current.length == 64 && clipImgsRef.current[index].confirm) {
  //                 confirm = true
  //             }

  //             let mismatch = false
  //             if (!!clipImgsRef.current && clipImgsRef.current.length == 64 && clipImgsRef.current[index].mismatch) {
  //                 mismatch = true
  //             }

  //             clipImgs.push(
  //                 {
  //                     id,
  //                     url: blockDataURL,
  //                     entropy: { l: entropy_l, r: entropy_r, t: entropy_t, b: entropy_b },
  //                     confirm: {},
  //                     mismatch,
  //                     mismatchTopArrary: [],
  //                     mismatchBottomArrary: []
  //                 })
  //             index += 1
  //         }
  //     }
  //     setClipImgs(clipImgs)
  //     clipImgsRef.current = clipImgs

  //     setUnConfirmClipImgs(clipImgs)

  // }
  async function prepareImgClips2() {
    const img0 = await imgLoad(imgUrl);
    console.log(img0.width, img0.height);
    setMainImg(imgUrl);
    let clipImgs = [];
    let index = 0;
    for (const coordinate of _clipCoordinate) {
      const { offsetX, offsetY, clipWidth, clipHeight } = coordinate;
      var blockCanvas = document.createElement("canvas");
      blockCanvas.width = clipWidth;
      blockCanvas.height = clipHeight;
      console.log(clipHeight);
      var blockCtx = blockCanvas.getContext("2d");
      blockCtx.drawImage(
        img0,
        offsetX,
        offsetY,
        clipWidth,
        clipHeight,
        0,
        0,
        clipWidth,
        clipHeight,
      );

      var imageData_b = blockCtx.getImageData(
        0,
        clipHeight - calcHeight,
        clipWidth,
        calcHeight,
      );
      var entropy_b = calculateEntropy(imageData_b.data);

      var imageData_t = blockCtx.getImageData(0, 0, clipWidth, calcHeight);
      var entropy_t = calculateEntropy(imageData_t.data);

      var imageData_l = blockCtx.getImageData(0, 0, calcHeight, clipHeight);
      var entropy_l = calculateEntropy(imageData_l.data);

      var imageData_r = blockCtx.getImageData(
        0,
        clipWidth - calcHeight,
        calcHeight,
        clipHeight,
      );
      var entropy_r = calculateEntropy(imageData_r.data);

      // 将小块Canvas转换为DataURL或进行其他操作
      var blockDataURL = blockCanvas.toDataURL();

      let mismatch = false;
      if (
        !!clipImgsRef.current &&
        clipImgsRef.current.length == 64 &&
        clipImgsRef.current[index].mismatch
      ) {
        mismatch = true;
      }

      clipImgs.push({
        id: nanoid(),
        originIndex: index,
        url: blockDataURL,
        entropy: { l: entropy_l, r: entropy_r, t: entropy_t, b: entropy_b },
        confirm: {},
        mismatch,
        mismatchTopArrary: [],
        mismatchBottomArrary: [],
      });
      index += 1;
    }
    setClipImgs(clipImgs);
    clipImgsRef.current = clipImgs;
    setUnConfirmClipImgs(clipImgs);
  }

  // 计算熵的函数
  function calculateEntropy(pixels) {
    var histogram = {};
    var totalPixels = pixels.length / 4;
    var entropy = 0;

    // 统计像素值的频率
    for (var i = 0; i < pixels.length; i += 4) {
      var r = pixels[i];
      var g = pixels[i + 1];
      var b = pixels[i + 2];
      var key = r + "," + g + "," + b;

      if (histogram[key]) {
        histogram[key]++;
      } else {
        histogram[key] = 1;
      }
    }

    // 计算熵
    for (var key in histogram) {
      var frequency = histogram[key] / totalPixels;
      entropy -= frequency * Math.log2(frequency);
    }

    return entropy;
  }

  function findClosestNumber(arr, target) {
    // 初始化最小差值为无穷大
    var minDiff = Infinity;
    var closestNumber;
    var index = 0;
    // 遍历数组
    for (var i = 0; i < arr.length; i++) {
      // 计算当前元素与目标数字的差值的绝对值
      var diff = Math.abs(arr[i] - target);

      // 如果差值更小，则更新最小差值和最接近的数字
      if (diff < minDiff) {
        minDiff = diff;
        closestNumber = arr[i];
        index = i;
      }
    }

    return { index, closestNumber };
  }

  function findSingoPair(index = 0) {
    // clipImgs:{
    //     id,
    //     url: blockDataURL,
    //     entropy: { l: entropy_l, r: entropy_r, t: entropy_t, b: entropy_b },
    //     confirm,
    //     mismatch,
    //     mismatchArrary: []
    // }
    let clipImgs = clipImgsRef.current;
    let sourceClip = clipImgs.at(index);
    let targetClip = null;
    let searchClipImgs = Array.from(clipImgs);
    searchClipImgs.splice(index, 1);

    const entropys = searchClipImgs.map((item) => item.entropy.b);
    const sourceClipTopEntropy = sourceClip.entropy.t;
    let { index: indexofEntropys, closestNumber } = findClosestNumber(
      entropys,
      sourceClipTopEntropy,
    );
    let id = searchClipImgs[indexofEntropys].id;
    const postion = clipImgs.findIndex((item) => item.id == id);
    targetClip = lodash.cloneDeep(clipImgs.at(postion));
    console.log(postion, sourceClipTopEntropy, closestNumber, id);
  }

  /**
   * 确认顶部匹配的切片
   * @param {ClipImg} clipImg
   */
  function confirmTopClip(clipImg) {
    let tempClipImgs = Array.from(unConfirmClipImgs);

    currentSelectedClipImg.confirm.t = clipImg.id;
    const index = tempClipImgs.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;

    if (clipImg.confirm.t) {
      //被确认的切片是其他已经被确认的切片的底部
      const index = confirmClipImgs.findIndex((item) => {
        //查找组最底部的一张是不是本次选中的切片
        const length = item.content.length - 1;
        return item.content.at(length).at(0).id == clipImg.id;
      });
      console.log(index);
      let confirmClipImg = confirmClipImgs[index];
      if (confirmClipImg.type == "1x2") {
        //竖排两张
        confirmClipImg.type = "1x3";
      } else if (confirmClipImg.type == "1x3") {
        //竖排两张
        confirmClipImg.type = "1x4";
      }
      confirmClipImg.id = nanoid();
      confirmClipImg.content.push([lodash.cloneDeep(currentSelectedClipImg)]);
      confirmClipImgs[index] = confirmClipImg;
      console.log(confirmClipImgs);
      setConfirmClipImgs(Array.from(confirmClipImgs));
    } else {
      const pair = {
        id: nanoid(),
        type: "1x2",
        confirm: {},
        content: [[clipImg], [lodash.cloneDeep(currentSelectedClipImg)]],
      };
      confirmClipImgs.unshift(pair);
      setConfirmClipImgs(Array.from(confirmClipImgs));
    }

    clipImg.confirm.b = currentSelectedClipImg.id;
    const index2 = tempClipImgs.findIndex((item) => item.id == clipImg.id);
    tempClipImgs[index2] = clipImg;

    const checkedClipImgs = tempClipImgs.filter(
      (item) => item.confirm.t || item.confirm.b,
    );
    const unCheckedClipImgs = tempClipImgs.filter(
      (item) => !item.confirm.t && !item.confirm.b,
    );
    const temp = unCheckedClipImgs.concat(checkedClipImgs);

    setClipImgs(Array.from(temp));
    setUnConfirmClipImgs(Array.from(temp));
  }

  function confirmBottomClip(clipImg) {
    let tempClipImgs = Array.from(unConfirmClipImgs);

    currentSelectedClipImg.confirm.b = clipImg.id;
    const index = tempClipImgs.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;

    if (clipImg.confirm.b) {
      //被确认的切片是其他已经被确认的切片的顶部
      const index = confirmClipImgs.findIndex((item) => {
        //查找组最顶部的一张是不是本次选中的切片
        return item.content.at(0).at(0).id == clipImg.id;
      });

      let confirmClipImg = confirmClipImgs[index];
      if (confirmClipImg.type == "1x2") {
        //竖排两张
        confirmClipImg.type = "1x3";
      } else if (confirmClipImg.type == "1x3") {
        //竖排两张
        confirmClipImg.type = "1x4";
      }
      confirmClipImg.id = nanoid();
      confirmClipImg.content.unshift([
        lodash.cloneDeep(currentSelectedClipImg),
      ]);
      confirmClipImgs[index] = confirmClipImg;
      setConfirmClipImgs(Array.from(confirmClipImgs));
    } else {
      const pair = {
        id: nanoid(),
        type: "1x2",
        confirm: {},
        content: [[lodash.cloneDeep(currentSelectedClipImg)], [clipImg]],
      };
      confirmClipImgs.unshift(pair);
      setConfirmClipImgs(Array.from(confirmClipImgs));
    }

    clipImg.confirm.t = currentSelectedClipImg.id;
    const index2 = tempClipImgs.findIndex((item) => item.id == clipImg.id);
    tempClipImgs[index2] = clipImg;

    const checkedClipImgs = tempClipImgs.filter(
      (item) => item.confirm.t || item.confirm.b,
    );
    const unCheckedClipImgs = tempClipImgs.filter(
      (item) => !item.confirm.t && !item.confirm.b,
    );
    const temp = unCheckedClipImgs.concat(checkedClipImgs);

    setClipImgs(Array.from(temp));
    setUnConfirmClipImgs(Array.from(temp));
  }

  // function confirmBottomClip(clipImg) {

  // }

  function mismatchTopClip(clipImg) {
    const id = clipImg.id;
    if (!currentSelectedClipImg.mismatchTopArrary.includes(id)) {
      currentSelectedClipImg.mismatchTopArrary.push(id);
      const index = tempClipImgs.findIndex(
        (item) => item.id == currentSelectedClipImg.id,
      );
      tempClipImgs[index] = lodash.cloneDeep(currentSelectedClipImg);
      setClipImgs(Array.from(tempClipImgs));
    }
  }
  /**
   * 排除底部不匹配的切片
   * @param {ClipImg} clipImg
   */
  function mismatchBottomClip(clipImg) {
    const id = clipImg.id;
    if (!currentSelectedClipImg.mismatchBottomArrary.includes(id)) {
      currentSelectedClipImg.mismatchBottomArrary.push(id);
      const index = tempClipImgs.findIndex(
        (item) => item.id == currentSelectedClipImg.id,
      );
      tempClipImgs[index] = currentSelectedClipImg;
      setClipImgs(Array.from(tempClipImgs));
    }
  }

  function mismatchAllTopClip() {
    for (const candidateClipImg of candidateClipImgs) {
      const { id } = candidateClipImg;
      if (!currentSelectedClipImg.mismatchTopArrary.includes(id)) {
        currentSelectedClipImg.mismatchTopArrary.push(id);
      }
    }
    const index = tempClipImgs.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;

    setClipImgs(Array.from(tempClipImgs));
  }

  function mismatchAllBottomClip() {
    for (const candidateClipImg of candidateBottomClipImgs) {
      const { id } = candidateClipImg;
      if (!currentSelectedClipImg.mismatchBottomArrary.includes(id)) {
        currentSelectedClipImg.mismatchBottomArrary.push(id);
      }
    }
    const index = tempClipImgs.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;

    setClipImgs(Array.from(tempClipImgs));
  }

  function unPiarClipImg(confirmClipImg, index) {
    confirmClipImgs.splice(index, 1);
    const { id, type, content } = confirmClipImg;
    if (type == "1x2") {
      let topClip = confirmClipImg.content.at(0).at(0);
      let bottomClip = confirmClipImg.content.at(1).at(0);
      topClip.confirm.t = null;
      topClip.confirm.b = null;
      bottomClip.confirm.t = null;
      bottomClip.confirm.b = null;

      let topClipIndex = tempClipImgs.findIndex(
        (item) => item.id == topClip.id,
      );
      tempClipImgs[topClipIndex] = topClip;

      let bottomClipIndex = tempClipImgs.findIndex(
        (item) => item.id == bottomClip.id,
      );
      tempClipImgs[bottomClipIndex] = bottomClip;
    } else {
      let bottomClip = confirmClipImg.content
        .at(confirmClipImg.content.length - 1)
        .at(0);
      let ThirdClip = confirmClipImg.content
        .at(confirmClipImg.content.length - 2)
        .at(0);
      bottomClip.confirm.t = null;
      ThirdClip.confirm.b = null;

      let topClipIndex = tempClipImgs.findIndex(
        (item) => item.id == ThirdClip.id,
      );
      tempClipImgs[topClipIndex] = ThirdClip;

      let bottomClipIndex = tempClipImgs.findIndex(
        (item) => item.id == bottomClip.id,
      );
      tempClipImgs[bottomClipIndex] = bottomClip;
    }
    setClipImgs(Array.from(tempClipImgs));
    setUnConfirmClipImgs(Array.from(tempClipImgs));
    setConfirmClipImgs(Array.from(confirmClipImgs));
  }

  function unCheckMisMatchAllTopClip(currentSelectedClipImg) {
    currentSelectedClipImg.mismatchTopArrary = [];
    const index = tempClipImgs.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;
    setClipImgs(Array.from(tempClipImgs));
  }

  function unCheckMisMatchAllBottomClip(currentSelectedClipImg) {
    currentSelectedClipImg.mismatchBottomArrary = [];
    const index = tempClipImgs.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;
    setClipImgs(Array.from(tempClipImgs));
  }

  useEffect(() => {
    console.log(currentSelectedPair);
    if (currentSelectedPair) {
      searchCandidateLeftClipImgs(currentSelectedPair);
      searchCandidateRightClipImgs(currentSelectedPair);
    }
  }, [currentSelectedPair]);

  function searchCandidateLeftClipImgs(currentSelectedPair) {
    const index = confirmClipImgs.findIndex((item) => {
      return item.id == currentSelectedPair.id;
    });
    let temp = Array.from(confirmClipImgs);
    temp = temp.filter((item) => {
      return !item.confirm.r;
    });
    temp.splice(index, 1);
    setCandidateLeftClipImgs(temp);
  }

  function searchCandidateRightClipImgs(currentSelectedPair) {
    const index = confirmClipImgs.findIndex((item) => {
      return item.id == currentSelectedPair.id;
    });
    let temp = Array.from(confirmClipImgs);
    temp = temp.filter((item) => {
      return !item.confirm.l;
    });
    temp.splice(index, 1);
    setCandidateRightClipImgs(temp);
  }

  function confirmLargeLeftClip(pair) {
    const tr = currentSelectedPair.content.at(0).at(0);
    const br = currentSelectedPair.content.at(1).at(0);
    const tl = pair.content.at(0).at(0);
    const bl = pair.content.at(1).at(0);

    const confirmLargeClipImgIndex = confirmLargeClipImgs.findIndex((item) => {
      const { type } = item;
      if (type == "2x2") {
        return item.contentIds[1].id == pair.id;
      } else if (type == "2x3") {
        return item.contentIds[2].id == pair.id;
      } else if (type == "2x4") {
        return item.contentIds[3].id == pair.id;
      } else {
        return false;
      }
    });

    if (~confirmLargeClipImgIndex) {
      let confirmLargeClipImg = confirmLargeClipImgs[confirmLargeClipImgIndex];
      const { type } = confirmLargeClipImg;
      if (type == "2x2") {
        confirmLargeClipImg.type = "2x3";
      } else if (type == "2x3") {
        confirmLargeClipImg.type = "2x4";
      } else if (type == "2x4") {
        confirmLargeClipImg.type = "2x5";
      }
      confirmLargeClipImg.contentIds.push(currentSelectedPair.id);
      confirmLargeClipImg.content[0].push(currentSelectedPair.content[0][0]);
      confirmLargeClipImg.content[1].push(currentSelectedPair.content[1][0]);

      setConfirmLargeClipImgs(Array.from(confirmLargeClipImgs));
    } else {
      let newPiar = {};
      newPiar.id = nanoid();
      newPiar.type = "2x2";
      newPiar.contentIds = [pair.id, currentSelectedPair.id];
      newPiar.content = [
        [tr, tl],
        [br, bl],
      ];

      const index = confirmClipImgs.findIndex(
        (item) => currentSelectedPair.id == item.id,
      );
      currentSelectedPair.confirm.l = pair.id;
      confirmClipImgs[index] = currentSelectedPair;
      setConfirmClipImgs(Array.from(confirmClipImgs));

      confirmLargeClipImgs.unshift(newPiar);
      setConfirmLargeClipImgs(Array.from(confirmLargeClipImgs));
    }
  }

  function confirmLargeRightClip(pair) {
    const tl = currentSelectedPair.content.at(0).at(0);
    const bl = currentSelectedPair.content.at(1).at(0);
    const tr = pair.content.at(0).at(0);
    const br = pair.content.at(1).at(0);

    const confirmLargeClipImgIndex = confirmLargeClipImgs.findIndex((item) => {
      const { type } = item;
      if (type == "2x2") {
        return item.contentIds[0].id == pair.id;
      } else if (type == "2x3") {
        return item.contentIds[0].id == pair.id;
      } else if (type == "2x4") {
        return item.contentIds[0].id == pair.id;
      } else {
        return false;
      }
    });

    if (~confirmLargeClipImgIndex) {
      let confirmLargeClipImg = confirmLargeClipImgs[confirmLargeClipImgIndex];
      const { type } = confirmLargeClipImg;
      if (type == "2x2") {
        confirmLargeClipImg.type = "2x3";
      } else if (type == "2x3") {
        confirmLargeClipImg.type = "2x4";
      } else if (type == "2x4") {
        confirmLargeClipImg.type = "2x5";
      }
      confirmLargeClipImg.contentIds.unshift(currentSelectedPair.id);
      confirmLargeClipImg.content[0].unshift(currentSelectedPair.content[0][0]);
      confirmLargeClipImg.content[1].unshift(currentSelectedPair.content[1][0]);

      setConfirmLargeClipImgs(Array.from(confirmLargeClipImgs));
    } else {
      let newPiar = {};
      newPiar.id = nanoid();
      newPiar.type = "2x2";
      newPiar.contentIds = [currentSelectedPair.id, pair.id];
      newPiar.content = [
        [tl, tr],
        [bl, br],
      ];

      const index = confirmClipImgs.findIndex(
        (item) => currentSelectedPair.id == item.id,
      );
      currentSelectedPair.confirm.l = pair.id;
      confirmClipImgs[index] = currentSelectedPair;
      setConfirmClipImgs(Array.from(confirmClipImgs));

      confirmLargeClipImgs.unshift(newPiar);
      setConfirmLargeClipImgs(Array.from(confirmLargeClipImgs));
    }
  }

  function unCheckLargeClip(clip) {
    const index = confirmLargeClipImgs.findIndex((item) => item.id == clip.id);
    confirmLargeClipImgs.splice(index, 1);

    setConfirmLargeClipImgs(Array.from(confirmLargeClipImgs));
  }

  return (
    <>
      <div className="container-full w-full h-full bg-base-100 overflow-hidden">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        {currentPage == "1" && (
          <div
            style={{ height: "calc(100vh - 176px)" }}
            className="w-full flex justify-between items-start"
          >
            <div className="w-[360px] border-dashed border-2 border-sky-500">
              <div
                style={{ height: "calc(100vh - 176px)" }}
                class=" my-0 grid grid-cols-4 gap-4 overflow-x-scroll"
              >
                {confirmClipImgs.map((item, index) => {
                  let { id, type, content } = item;
                  let clipTop = content.at(0).at(0);
                  let clipBottom = content.at(1).at(0);

                  let confirm = false;

                  if (!!item.confirm.l) {
                    confirm = true;
                  }
                  if (!!item.confirm.r) {
                    confirm = true;
                  }

                  return (
                    <div
                      Key={"confirmClipImgs" + clipTop.id}
                      style={{ fontSize: 9 }}
                      className=""
                    >
                      <div className="text-center">{clipTop.entropy.t}</div>
                      <div
                        style={{ opacity: confirm ? 0.5 : 1 }}
                        className="flex flex-col justify-start items-center cursor-pointer"
                        onClick={() => {
                          setCurrentSelectedPair(item);
                        }}
                      >
                        <img className="w-20" src={clipTop.url}></img>
                        <img className="w-20" src={clipBottom.url}></img>
                      </div>
                      <div className="text-center">{clipBottom.entropy.b}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-[320px] border-dashed border-2 border-yellow-300 flex justify-between items-start ml-5">
              {/* 左侧的候选 */}
              <div
                className="w-20 overflow-y-scroll"
                style={{ height: "calc(100vh - 176px)" }}
              >
                {candidateLeftClipImgs.map((item, index) => {
                  let { rowCount, colCount, content } = item;
                  let clipTop = content.at(0).at(0);
                  let clipBottom = content.at(1).at(0);

                  return (
                    <div style={{ fontSize: 9 }} className="">
                      <div className="text-center">{clipTop.entropy.t}</div>
                      <div
                        className="flex flex-col justify-start items-center cursor-pointer"
                        onClick={() => {
                          confirmLargeLeftClip(item);
                        }}
                      >
                        <img className="w-20" src={clipTop.url}></img>
                        <img className="w-20" src={clipBottom.url}></img>
                      </div>
                      <div className="text-center">{clipBottom.entropy.b}</div>
                    </div>
                  );
                })}
              </div>

              {/* 中间的当前选择切片 */}
              <div
                className="w-20 flex flex-col justify-center items-center ml-5"
                style={{ height: "calc(100vh - 176px)" }}
              >
                {currentSelectedPair && (
                  <div
                    Key={
                      "confirmClipImgs" +
                      currentSelectedPair.content.at(0).at(0).id
                    }
                    style={{ fontSize: 9 }}
                    className=""
                  >
                    <div className="text-center">
                      {currentSelectedPair.content.at(0).at(0).entropy.t}
                    </div>
                    <div
                      className="flex flex-col justify-start items-center cursor-pointer"
                      onClick={() => {}}
                    >
                      <img
                        className="w-20"
                        src={currentSelectedPair.content.at(0).at(0).url}
                      ></img>
                      <img
                        className="w-20"
                        src={currentSelectedPair.content.at(1).at(0).url}
                      ></img>
                    </div>
                    <div className="text-center">
                      {currentSelectedPair.content.at(1).at(0).entropy.b}
                    </div>
                  </div>
                )}
              </div>
              {/* 右边的候选切面 */}
              <div
                className="w-25 overflow-y-scroll  overflow-x-hidden"
                style={{ height: "calc(100vh - 176px)" }}
              >
                {candidateLeftClipImgs.map((item, index) => {
                  let { id, type, content } = item;
                  let clipTop = content.at(0).at(0);
                  let clipBottom = content.at(1).at(0);

                  return (
                    <div style={{ fontSize: 9 }} className="">
                      <div className="text-center">{clipTop.entropy.t}</div>
                      <div
                        className="flex flex-col justify-start items-center cursor-pointer"
                        onClick={() => {
                          confirmLargeRightClip(item);
                        }}
                      >
                        <img className="w-20" src={clipTop.url}></img>
                        <img className="w-20" src={clipBottom.url}></img>
                      </div>
                      <div className="text-center">{clipBottom.entropy.b}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 已经确认的大切片 */}
            <div className="flex-1 flex justify-between items-start ml-5 border-dashed border-2 border-green-300">
              <div class=" my-4 grid grid-cols-2 gap-4 overflow-x-scroll">
                {confirmLargeClipImgs.map((item, index) => {
                  const { id, type, content } = item;

                  if (type == "3x2") {
                    const lt = content.at(0).at(0);
                    const ct = content.at(0).at(1);
                    const rt = content.at(0).at(2);

                    const lb = content.at(1).at(0);
                    const cb = content.at(1).at(1);
                    const rb = content.at(1).at(2);

                    return (
                      <div
                        className="grid grid-cols-3 gap-0"
                        onClick={(e) => {
                          unCheckLargeClip(item);
                        }}
                      >
                        <img className="w-20" src={lt.url}></img>
                        <img className="w-20" src={ct.url}></img>
                        <img className="w-20" src={rt.url}></img>
                        <img className="w-20" src={lb.url}></img>
                        <img className="w-20" src={cb.url}></img>
                        <img className="w-20" src={rb.url}></img>
                      </div>
                    );
                  } else {
                    const lt = content.at(0).at(0);
                    const rt = content.at(0).at(1);
                    const lb = content.at(1).at(0);
                    const rb = content.at(1).at(1);

                    return (
                      <div
                        style={{ fontSize: 9 }}
                        className="grid grid-cols-2 gap-0"
                        onClick={(e) => {
                          unCheckLargeClip(item);
                        }}
                      >
                        <img className="w-20" src={lt.url}></img>
                        <img className="w-20" src={rt.url}></img>
                        <img className="w-20" src={lb.url}></img>
                        <img className="w-20" src={rb.url}></img>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        )}

        {currentPage == "0" && <Phase1Screen />}
      </div>
    </>
  );
}
