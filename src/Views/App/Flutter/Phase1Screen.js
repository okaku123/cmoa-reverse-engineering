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
import { calculateEntropy, findClosestNumber } from "./Tools";
import { useLatest } from "react-use";

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

export default function Phase1Screen(props) {
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
  const latestUnConfirmClipImgs = useLatest(unConfirmClipImgs);
  /**
   * 已经确认的切片 初级
   */
  const [confirmClipImgs, setConfirmClipImgs] = useState([]);
  const latestConfirmClipImgs = useLatest(confirmClipImgs);

  const [currentPage, setCurrentPage] = useState("0");

  const [currentSelectedPair, setCurrentSelectedPair] = useState(null);
  const [candidateLeftClipImgs, setCandidateLeftClipImgs] = useState([]);
  const [candidateRightClipImgs, setCandidateRightClipImgs] = useState([]);

  const [confirmLargeClipImgs, setConfirmLargeClipImgs] = useState([]);
  const [_clipCoordinate, setClipCoordinate] = useState(null);
  const currentFiexd = useRef({ top: 0, left: 0, bottom: 0, right: 0 });

  const corpOffsetRef = useRef({ top: 0, left: 0, bottom: 0, right: 0 });

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
        await delay(60);
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

  /**
   * 重新切片指定row的切片
   * @param {Int} row
   */
  async function reCorpClipImgs(axis, offset) {
    let unConfirmClipImgs = latestUnConfirmClipImgs.current;
    let confirmClipImgs = latestConfirmClipImgs.current;
    if (confirmClipImgs.length == 0) return;

    if (axis == "Horizontal") {
    } else {
      //公共偏移量top-1
      console.log(corpOffsetRef.current.top);
      corpOffsetRef.current.top = corpOffsetRef.current.top + offset;
    }

    //修改确认组里最后一排的切片偏移量
    let bottomClip =
      confirmClipImgs[0].content[confirmClipImgs[0].content.length - 1][0];
    if (axis == "Horizontal") {
      bottomClip.coordinate.offsetX += offset;
    } else {
      bottomClip.coordinate.offsetY += offset;
    }
    const img0 = await imgLoad(imgUrl);

    const { offsetX, offsetY, clipWidth, clipHeight } = bottomClip.coordinate;
    var blockCanvas = document.createElement("canvas");
    blockCanvas.width = clipWidth;
    blockCanvas.height = clipHeight;
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
    var blockDataURL = blockCanvas.toDataURL();

    const index = unConfirmClipImgs.findIndex(
      (item) => item.originIndex == bottomClip.originIndex,
    );
    unConfirmClipImgs[index].entropy = {
      l: entropy_l,
      r: entropy_r,
      t: entropy_t,
      b: entropy_b,
    };
    unConfirmClipImgs[index].renderId = nanoid();
    unConfirmClipImgs[index].url = blockDataURL;
    unConfirmClipImgs[index].coordinate = bottomClip.coordinate;
    //修改确认组里最后一排的切片偏移量
    confirmClipImgs[0].content[confirmClipImgs[0].content.length - 1][0] =
      lodash.cloneDeep(unConfirmClipImgs[index]);

    setConfirmClipImgs(Array.from(confirmClipImgs));
    setUnConfirmClipImgs(Array.from(unConfirmClipImgs));
  }
  function hande(event) {
    console.log(event);
    const confirmClipImgs = latestConfirmClipImgs.current;
    if (confirmClipImgs.length === 0) {
      return;
    }
    //修改确认组里最后一排的切片偏移量
    let firstItem =
      confirmClipImgs[0].content[confirmClipImgs[0].content.length - 1][0];
    console.log(firstItem);
    if (event.key === "ArrowUp") {
      if (firstItem.fiexd.bottom > 0) {
        firstItem.fiexd.bottom = firstItem.fiexd.bottom - 1;
      } else {
        firstItem.fiexd.top = firstItem.fiexd.top + 1;
      }
    } else if (event.key === "ArrowDown") {
      if (firstItem.fiexd.top > 0) {
        firstItem.fiexd.top = firstItem.fiexd.top - 1;
      } else {
        firstItem.fiexd.bottom = firstItem.fiexd.bottom + 1;
      }
    } else if (event.key === "ArrowLeft") {
      if (firstItem.fiexd.right > 0) {
        firstItem.fiexd.right = firstItem.fiexd.right - 1;
      } else {
        firstItem.fiexd.left = firstItem.fiexd.left + 1;
      }
    } else if (event.key === "ArrowRight") {
      if (firstItem.fiexd.left > 0) {
        firstItem.fiexd.left = firstItem.fiexd.left - 1;
      } else {
        firstItem.fiexd.right = firstItem.fiexd.right + 1;
      }
    } else if (event.code == "KeyW") {
      reCorpClipImgs("Vertical", -1);
    } else if (event.code == "KeyA") {
      reCorpClipImgs("Horizontal", -1);
    } else if (event.code == "KeyS") {
      reCorpClipImgs("Vertical", 1);
    } else if (event.code == "KeyD") {
      reCorpClipImgs("Horizontal", 1);
    }

    currentFiexd.current = lodash.cloneDeep(firstItem.fiexd);
    setConfirmClipImgs(Array.from(confirmClipImgs));
  }

  useEffect(() => {
    document.addEventListener("keydown", hande);
    return () => {
      document.removeEventListener("keydown", hande);
    };
  }, []);

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

      clipImgs.push({
        renderId: nanoid(),
        id: nanoid(),
        coordinate,
        originIndex: index,
        originWidth: clipWidth,
        originHeight: clipHeight,
        fiexd: { top: 0, left: 0, bottom: 0, right: 0 },
        url: blockDataURL,
        entropy: { l: entropy_l, r: entropy_r, t: entropy_t, b: entropy_b },
        confirm: {},
        mismatchTopArrary: [],
        mismatchBottomArrary: [],
      });
      index += 1;
    }
    setClipImgs(clipImgs);
    clipImgsRef.current = clipImgs;
    setUnConfirmClipImgs(clipImgs);
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
    let confirmClipImgs = latestConfirmClipImgs.current;
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
      let confirmClipImg = confirmClipImgs[index];
      if (confirmClipImg.type == "1x2") {
        //竖排两张
        confirmClipImg.type = "1x3";
      } else if (confirmClipImg.type == "1x3") {
        //竖排两张
        confirmClipImg.type = "1x4";
      }
      confirmClipImg.renderId = nanoid();
      //设置公用偏移量
      currentSelectedClipImg.fiexd = lodash.cloneDeep(currentFiexd.current);
      confirmClipImg.content.push([lodash.cloneDeep(currentSelectedClipImg)]);
      confirmClipImgs[index] = confirmClipImg;

      //当前匹配的切片是已经被匹配过的切片，需要重新排序确认偏移量
      const [needReSortItem] = confirmClipImgs.splice(index, 1);
      confirmClipImgs.unshift(needReSortItem);
      //改变UI
      setConfirmClipImgs(Array.from(confirmClipImgs));
    } else {
      let cloneDeep = lodash.cloneDeep(currentSelectedClipImg);
      cloneDeep.fiexd = lodash.cloneDeep(currentFiexd.current);
      console.log(cloneDeep);
      const pair = {
        renderId: nanoid(),
        id: nanoid(),
        type: "1x2",
        confirm: {},
        content: [[clipImg], [cloneDeep]],
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
    //TODO: 当确定的切片是qx2时，做偏移操作
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
      clipImg.fiexd = lodash.cloneDeep(currentFiexd.current);
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

  function reSortConfirmClipImg(index) {
    const spliced = confirmClipImgs.splice(index, 1);
    confirmClipImgs.unshift(spliced[0]);
    setConfirmClipImgs(Array.from(confirmClipImgs));
  }

  return (
    <div
      style={{ height: "calc(100vh - 176px)" }}
      className="w-full flex justify-between items-start"
    >
      {/* 所有切片 */}
      <div
        style={{ height: "calc(100vh - 176px)" }}
        className=" w-1/4 shrink-0 items-stretch overflow-y-scroll"
      >
        <div className="w-full px-5 flex justify-between items-center">
          <lable className="text-sm">
            剩余切片 {unConfirmClipImgs.length - confirmClipImgs.length * 2}
          </lable>
          <lable className="text-sm">
            匹配切片 {confirmClipImgs.length * 2}
          </lable>
        </div>

        <div class=" my-9 grid grid-cols-4 gap-4">
          {unConfirmClipImgs.map((clipImg) => {
            const { url, entropy } = clipImg;
            let confirm = false;

            if (!!clipImg.confirm.b) {
              confirm = true;
            }
            if (!!clipImg.confirm.t) {
              console.log("!!clipImg.confirm.t)");
              confirm = true;
            }

            return (
              <div key={clipImg.renderId} style={{ fontSize: 9 }} className="">
                <div className="text-center">{entropy.t}</div>

                <div className="flex justify-center items-center">
                  <label style={{ writingMode: "vertical-lr" }}>
                    {entropy.l}
                  </label>
                  <img
                    className="w-20"
                    src={url}
                    style={{ opacity: confirm ? 0.5 : 1 }}
                    onClick={() => {
                      setCurrentSelectedClipImg(clipImg);
                    }}
                  ></img>
                  <label style={{ writingMode: "vertical-lr" }}>
                    {entropy.r}
                  </label>
                </div>
                <div className="text-center">{entropy.b}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 已经确认切片 */}
      <div className="flex-1 px-5">
        <div
          style={{ height: "calc(100vh - 176px)" }}
          class=" my-0 grid grid-cols-4 gap-4 overflow-x-scroll"
        >
          {confirmClipImgs.map((item, index) => {
            let { renderId, id, type, content } = item;

            let cellRealUpWidth = "";
            let cellRealUpHeight = "";
            let cellRealDownWidth = "";
            let cellRealDownHeight = "";

            if (index == 0) {
              cellRealUpWidth = content.at(0).at(0).originWidth;
              cellRealUpHeight = content.at(0).at(0).originHeight;
              cellRealDownWidth = content.at(1).at(0).originWidth;
              cellRealDownHeight = content.at(1).at(0).originHeight;
            }

            let cellWidth = "w-20";
            if (index === 0) {
              cellWidth = "w-40";
            }
            let cellStyle =
              "flex flex-col justify-start items-center cursor-pointer ";
            if (index === 0) {
              cellStyle =
                "flex flex-col justify-start items-center cursor-pointer shrink-0";
            }

            if (type == "1x2") {
              let clipTop = content.at(0).at(0);
              let clipBottom = content.at(1).at(0);

              const { fiexd } = clipBottom;
              const { top } = fiexd;

              return (
                <div key={renderId} style={{ fontSize: 9 }} className="">
                  <div className="text-center ">{clipTop.entropy.t}</div>
                  <div
                    style={{ width: cellRealUpWidth }}
                    className={cellStyle}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      unPiarClipImg(item, index);
                    }}
                    onClick={() => {
                      reSortConfirmClipImg(index);
                    }}
                  >
                    <img
                      style={{
                        width: cellRealUpWidth,
                        height: cellRealUpHeight,
                      }}
                      className="block w-20"
                      src={clipTop.url}
                    ></img>
                    <img
                      style={{
                        width: cellRealUpWidth,
                        height: cellRealUpHeight,
                        marginTop: -top,
                      }}
                      className="block w-20"
                      src={clipBottom.url}
                    ></img>
                  </div>
                  <div className="text-center">{clipBottom.entropy.b}</div>
                </div>
              );
            } else if (type == "1x3") {
              let clipTop = content.at(0).at(0);
              let clipCenter = content.at(1).at(0);
              let clipBottom = content.at(2).at(0);

              const { fiexd: fiexdCenter } = clipCenter;
              const { top: topCenter } = fiexdCenter;

              const { fiexd: fiexdBottom } = clipBottom;
              const { top: topBottom } = fiexdBottom;

              return (
                <div key={renderId} style={{ fontSize: 9 }} className="">
                  <div className="text-center">{clipTop.entropy.t}</div>
                  <div
                    className={cellStyle}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      unPiarClipImg(item, index);
                    }}
                    onClick={() => {
                      reSortConfirmClipImg(index);
                    }}
                  >
                    <img
                      style={{
                        width: cellRealUpWidth,
                        height: cellRealUpHeight,
                      }}
                      className="block w-20"
                      src={clipTop.url}
                    />
                    <img
                      style={{
                        width: cellRealUpWidth,
                        height: cellRealUpHeight,
                        marginTop: -topCenter,
                      }}
                      className="block w-20"
                      src={clipCenter.url}
                    />
                    <img
                      style={{
                        width: cellRealUpWidth,
                        height: cellRealUpHeight,
                        marginTop: -topBottom,
                      }}
                      className="block w-20"
                      src={clipBottom.url}
                    />
                  </div>
                  <div className="text-center">{clipBottom.entropy.b}</div>
                </div>
              );
            } else if (type == "1x4") {
              let clipTop = content.at(0).at(0);
              let clipSecond = content.at(1).at(0);
              let clipThird = content.at(1).at(0);
              let clipBottom = content.at(2).at(0);
              return (
                <div key={renderId} style={{ fontSize: 9 }} className="">
                  <div className="text-center">{clipTop.entropy.t}</div>
                  <div
                    className={cellStyle}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      unPiarClipImg(item, index);
                    }}
                    onClick={() => {
                      reSortConfirmClipImg(index);
                    }}
                  >
                    <img className={cellWidth} src={clipTop.url}></img>
                    <img className={cellWidth} src={clipSecond.url}></img>
                    <img className={cellWidth} src={clipThird.url}></img>
                    <img className={cellWidth} src={clipBottom.url}></img>
                  </div>
                  <div className="text-center">{clipBottom.entropy.b}</div>
                </div>
              );
            }
          })}
        </div>
      </div>
      <div className="w-1/4 min-h-96 border-l-[1px] border-emerald-300 self-stretch">
        <div className="w-full text-center">配对区</div>
        <div className="w-full text-center mt-5 px-5 flex justify-between items-center">
          <label
            className="btn btn-secondary btn-sm "
            onClick={() => {
              mismatchAllTopClip();
              setTimeout(() => {
                searchCandidateClipImgs(currentSelectedClipImg);
              }, 80);
            }}
          >
            全部不匹配
          </label>
          <label
            className="btn btn-accent btn-sm "
            onClick={() => {
              unCheckMisMatchAllTopClip(currentSelectedClipImg);
              setTimeout(() => {
                searchCandidateClipImgs(currentSelectedClipImg);
              }, 80);
            }}
          >
            取消不匹配
          </label>
        </div>
        <div class=" my-4 grid grid-cols-3 gap-4 overflow-x-scroll">
          {candidateClipImgs.map((item) => {
            return (
              <div
                key={"candidateClipImgs" + item.id}
                style={{ fontSize: 9 }}
                className=""
              >
                <div className="text-center">{item.entropy.t}</div>
                <div className="flex justify-center items-center">
                  <label style={{ writingMode: "vertical-lr" }}>
                    {item.entropy.l}
                  </label>
                  <img
                    className="w-20"
                    src={item.url}
                    onClick={() => {
                      confirmTopClip(item);
                    }}
                    onContextMenu={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      mismatchTopClip(item);
                      // await delay(500)
                      setTimeout(() => {
                        searchCandidateClipImgs(currentSelectedClipImg);
                      }, 200);
                    }}
                  ></img>
                  <label style={{ writingMode: "vertical-lr" }}>
                    {item.entropy.r}
                  </label>
                </div>
                <div className="text-center">{item.entropy.b}</div>
              </div>
            );
          })}
        </div>

        {currentSelectedClipImg && (
          <div className="w-full flex justify-center items-center">
            <div style={{ fontSize: 9 }} className="">
              <div className="text-center">
                {currentSelectedClipImg.entropy.t}
              </div>
              <div className="flex justify-center items-center">
                <label style={{ writingMode: "vertical-lr" }}>
                  {currentSelectedClipImg.entropy.l}
                </label>
                <img className="w-20" src={currentSelectedClipImg.url}></img>
                <label style={{ writingMode: "vertical-lr" }}>
                  {currentSelectedClipImg.entropy.r}
                </label>
              </div>
              <div className="text-center">
                {currentSelectedClipImg.entropy.b}
              </div>
            </div>
          </div>
        )}

        <div class=" my-9 grid grid-cols-3 gap-4 overflow-x-scroll">
          {candidateBottomClipImgs.map((item, index) => {
            return (
              <div
                key={"candidateBottomClipImgs" + item.id}
                style={{ fontSize: 9 }}
                className=""
              >
                <div className="text-center">{item.entropy.t}</div>
                <div className="flex justify-center items-center">
                  <label style={{ writingMode: "vertical-lr" }}>
                    {item.entropy.l}
                  </label>
                  <img
                    className="w-20"
                    src={item.url}
                    onClick={() => {
                      confirmBottomClip(item);
                    }}
                    onContextMenu={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      mismatchBottomClip(item);
                      setTimeout(() => {
                        searchCandidateBottomClipImgs(currentSelectedClipImg);
                      }, 200);
                    }}
                  ></img>
                  <label style={{ writingMode: "vertical-lr" }}>
                    {item.entropy.r}
                  </label>
                </div>
                <div className="text-center">{item.entropy.b}</div>
              </div>
            );
          })}
        </div>

        <div className="w-full text-center mt-0 px-5 flex justify-between items-center">
          <label
            className="btn btn-secondary btn-sm "
            onClick={() => {
              mismatchAllBottomClip();
              setTimeout(() => {
                searchCandidateBottomClipImgs(currentSelectedClipImg);
              }, 80);
            }}
          >
            全部不匹配
          </label>
          <label
            className="btn btn-accent btn-sm "
            onClick={() => {
              unCheckMisMatchAllBottomClip(currentSelectedClipImg);
              setTimeout(() => {
                searchCandidateBottomClipImgs(currentSelectedClipImg);
              }, 80);
            }}
          >
            取消不匹配
          </label>
        </div>
      </div>
    </div>
  );
}
