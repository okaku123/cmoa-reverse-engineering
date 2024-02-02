import { useState, useEffect, useRef } from "react";
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
  const {
    tempClipImgs,
    setClipImgs,
    currentSelectedClipImg,
    setCurrentSelectedClipImg,
    candidateClipImgs,
    setCandidateClipImgs,
    candidateBottomClipImgs,
    setCandidateBottomClipImgs,
    latestUnConfirmClipImgs,
    latestConfirmClipImgs,
    unConfirmClipImgs,
    setUnConfirmClipImgs,
    confirmClipImgs,
    setConfirmClipImgs,
    currentFiexd,
    corpOffsetRef,
    calcHeight,
    latestTempClipImgs,
    latestCurrentSelectedClipImg,
    lastCandidateClipImgs,
    lastCandidateBottomClipImgs,
  } = props;

  /**
   * 搜索符合目标切片顶部的三张候选切片
   * @param {ClipImg} currentSelectedClipImg
   */
  async function searchCandidateClipImgs(currentSelectedClipImg) {
    //容纳切片
    let candidateClipImgs = [];
    //使用ref保持最新
    const tempClipImgs = latestTempClipImgs.current;
    //make a copy
    let clipImgsCopy = Array.from(tempClipImgs);
    //过滤掉已经被排除的切片
    clipImgsCopy = clipImgsCopy.filter((item) => {
      return !currentSelectedClipImg.mismatchTopArrary.includes(item.id);
    });
    //过滤已经确定底部的切片
    clipImgsCopy = clipImgsCopy.filter((item) => {
      return !item.confirm.b;
    });
    //过滤掉等待匹配的当前切片自己
    const currentSelectedClipImgIndex = clipImgsCopy.findIndex(
      (item) => item.id == currentSelectedClipImg.id,
    );
    clipImgsCopy.splice(currentSelectedClipImgIndex, 1);

    if (clipImgsCopy.length == 0) {
      return;
    }

    let clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.b);
    let { index: indexofEntropys, closestNumber } = findClosestNumber(
      clipImgsCopyEntropys,
      currentSelectedClipImg.entropy.t,
    );
    const firstCandidateClipImgID = clipImgsCopy[indexofEntropys].id;
    const firstCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == firstCandidateClipImgID,
    );
    //排除掉熵最近的一张切片
    clipImgsCopy.splice(indexofEntropys, 1);

    if (clipImgsCopy.length == 0) {
      //...do something
      candidateClipImgs.push(firstCandidateClipImg);
      setCandidateClipImgs(candidateClipImgs);
      return;
    }

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

    if (clipImgsCopy.length == 0) {
      candidateClipImgs.push(secondCandidateClipImg);
      candidateClipImgs.push(firstCandidateClipImg);
      setCandidateClipImgs(candidateClipImgs);
      return;
    }

    clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.b);
    let { index: indexofEntropysNearNear, closestNumberNearNear } =
      findClosestNumber(clipImgsCopyEntropys, currentSelectedClipImg.entropy.t);
    const thirdCandidateClipImgID = clipImgsCopy[indexofEntropysNearNear].id;
    const thirdCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == thirdCandidateClipImgID,
    );

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
    let candidateClipImgs = [];
    const tempClipImgs = latestTempClipImgs.current;
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

    if (clipImgsCopy.length == 0) {
      return;
    }

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

    if (clipImgsCopy.length == 0) {
      candidateClipImgs.push(firstCandidateClipImg);
      setCandidateBottomClipImgs(candidateClipImgs);
      return;
    }
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

    if (clipImgsCopy.length == 0) {
      candidateClipImgs.push(firstCandidateClipImg);
      candidateClipImgs.push(secondCandidateClipImg);
      setCandidateBottomClipImgs(candidateClipImgs);
      return;
    }

    clipImgsCopyEntropys = clipImgsCopy.map((item) => item.entropy.t);
    let { index: indexofEntropysNearNear, closestNumberNearNear } =
      findClosestNumber(clipImgsCopyEntropys, currentSelectedClipImg.entropy.b);
    const thirdCandidateClipImgID = clipImgsCopy[indexofEntropysNearNear].id;
    const thirdCandidateClipImg = clipImgsCopy.find(
      (item) => item.id == thirdCandidateClipImgID,
    );

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

  /**
   * 确认顶部匹配的切片
   * @param {ClipImg} clipImg
   */
  function confirmTopClip(clipImg) {
    let confirmClipImgs = latestConfirmClipImgs.current;
    let unConfirmClipImgs = latestUnConfirmClipImgs.current;
    let tempClipImgs = Array.from(unConfirmClipImgs);
    let currentSelectedClipImg = latestCurrentSelectedClipImg.current;

    currentSelectedClipImg.confirm.t = clipImg.id;
    const index = tempClipImgs.findIndex(
      (item) => item.id === currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;

    if (clipImg.confirm.t) {
      //被确认的切片是其他已经被确认的切片的底部
      const index = confirmClipImgs.findIndex((item) => {
        //查找组最底部的一张是不是本次选中的切片
        const length = item.content.length - 1;
        return item.content.at(length).at(0).id === clipImg.id;
      });
      let confirmClipImg = confirmClipImgs[index];
      if (confirmClipImg.type == "1x2") {
        confirmClipImg.type = "1x3";
      } else if (confirmClipImg.type == "1x3") {
        confirmClipImg.type = "1x4";
      } else if (confirmClipImg.type == "1x4") {
        return;
      }

      confirmClipImg.renderId = nanoid();
      //设置公用偏移量
      currentSelectedClipImg.fiexd = lodash.cloneDeep(currentFiexd.current);
      confirmClipImg.content.push([lodash.cloneDeep(currentSelectedClipImg)]);
      confirmClipImgs[index] = confirmClipImg;

      //当前匹配的切片是已经被匹配过的切片，需要重新排序确认偏移量
      const needReSortItems = confirmClipImgs.splice(index, 1);
      confirmClipImgs.unshift(needReSortItems.at(0));
      //改变UI
      setConfirmClipImgs(Array.from(confirmClipImgs));
    } else {
      let cloneDeep = lodash.cloneDeep(currentSelectedClipImg);
      cloneDeep.fiexd = lodash.cloneDeep(currentFiexd.current);
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
    const index2 = tempClipImgs.findIndex((item) => item.id === clipImg.id);
    tempClipImgs[index2] = clipImg;

    const checkedClipImgs = tempClipImgs.filter(
      (item) => !!item.confirm.t || !!item.confirm.b,
    );
    const unCheckedClipImgs = tempClipImgs.filter(
      (item) => !item.confirm.t && !item.confirm.b,
    );
    const temp = unCheckedClipImgs.concat(checkedClipImgs);

    setClipImgs(Array.from(temp));
    setUnConfirmClipImgs(Array.from(temp));
  }

  function confirmBottomClip(clipImg) {
    let confirmClipImgs = latestConfirmClipImgs.current;
    let unConfirmClipImgs = latestUnConfirmClipImgs.current;
    let tempClipImgs = Array.from(unConfirmClipImgs);
    let currentSelectedClipImg = latestCurrentSelectedClipImg.current;
    currentSelectedClipImg.confirm.b = clipImg.id;
    const index = tempClipImgs.findIndex(
      (item) => item.id === currentSelectedClipImg.id,
    );
    tempClipImgs[index] = currentSelectedClipImg;
    if (clipImg.confirm.b) {
      //被确认的切片是其他已经被确认的切片的顶部
      const index = confirmClipImgs.findIndex((item) => {
        //查找组最顶部的一张是不是本次选中的切片
        return item.content.at(0).at(0).id === clipImg.id;
      });

      let confirmClipImg = confirmClipImgs[index];
      if (confirmClipImg.type == "1x2") {
        confirmClipImg.type = "1x3";
      } else if (confirmClipImg.type == "1x3") {
        confirmClipImg.type = "1x4";
      } else if (confirmClipImg.type == "1x4") {
        return;
      }
      confirmClipImg.id = nanoid();
      confirmClipImg.content.unshift([
        lodash.cloneDeep(currentSelectedClipImg),
      ]);
      confirmClipImgs[index] = confirmClipImg;

      //当前匹配的切片是已经被匹配过的切片，需要重新排序确认偏移量
      const [needReSortItem] = confirmClipImgs.splice(index, 1);
      confirmClipImgs.unshift(needReSortItem);

      setConfirmClipImgs(Array.from(confirmClipImgs));
    } else {
      clipImg.fiexd = lodash.cloneDeep(currentFiexd.current);
      const pair = {
        renderId: nanoid(),
        id: nanoid(),
        type: "1x2",
        confirm: {},
        content: [[lodash.cloneDeep(currentSelectedClipImg)], [clipImg]],
      };
      confirmClipImgs.unshift(pair);
      setConfirmClipImgs(Array.from(confirmClipImgs));
    }

    clipImg.confirm.t = currentSelectedClipImg.id;
    const index2 = tempClipImgs.findIndex((item) => item.id === clipImg.id);
    tempClipImgs[index2] = clipImg;

    const checkedClipImgs = tempClipImgs.filter(
      (item) => !!item.confirm.t || !!item.confirm.b,
    );
    const unCheckedClipImgs = tempClipImgs.filter(
      (item) => !item.confirm.t && !item.confirm.b,
    );
    const temp = unCheckedClipImgs.concat(checkedClipImgs);
    setClipImgs(Array.from(temp));
    setUnConfirmClipImgs(Array.from(temp));
  }

  function mismatchClip(postion, clipImg) {
    //limit for key
    if (!["Top", "Bottom"].includes(postion)) return;
    const mismatchPostion = `mismatch${postion}Arrary`;

    let currentSelectedClipImg = latestCurrentSelectedClipImg.current;
    let tempClipImgs = Array.from(latestUnConfirmClipImgs.current);
    const id = clipImg.id;
    if (!currentSelectedClipImg[mismatchPostion].includes(id)) {
      currentSelectedClipImg[mismatchPostion].push(id);
      const index = tempClipImgs.findIndex(
        (item) => item.id === currentSelectedClipImg.id,
      );
      tempClipImgs[index] = lodash.cloneDeep(currentSelectedClipImg);
      setClipImgs(Array.from(tempClipImgs));
    }
  }

  function mismatchAllTopClip() {
    let candidateClipImgs = lastCandidateClipImgs.current;
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
    let candidateBottomClipImgs = lastCandidateBottomClipImgs.current;
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
                    alt={item.id}
                    className="w-20"
                    src={item.url}
                    onClick={() => {
                      confirmTopClip(item);
                    }}
                    onContextMenu={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      mismatchClip("Top", item);
                      setTimeout(() => {
                        searchCandidateClipImgs(currentSelectedClipImg);
                      }, 200);
                    }}
                  />
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
                    alt={item.id}
                    className="w-20"
                    src={item.url}
                    onClick={() => {
                      confirmBottomClip(item);
                    }}
                    onContextMenu={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      mismatchClip("Bottom", item);
                      setTimeout(() => {
                        searchCandidateBottomClipImgs(currentSelectedClipImg);
                      }, 200);
                    }}
                  />
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
