import {
  useState,
  useEffect,
  useRef,
  createRef,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "./main.css";
import { nanoid } from "nanoid";
import lodash from "lodash";
import { calculateEntropy, findClosestNumber } from "./Tools";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import LargeClipCell from "./LargeClipCell";

import "reactflow/dist/style.css";
const viewHeight = "calc(100vh - 64px)";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const imgUrl = "./sbcGetImg1.jpg";

// const initialNodes = [
//     { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
//     { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
// ];

// const initialNodes = [
//     {
//       id: 'node-1',
//       type: 'textUpdater',
//       position: { x: 0, y: 0 },
//       data: { value: 123 },
//     },
//   ];

const initialEdges = [];

function imgLoad(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}

export default function Phase3Screen(props) {
  const largeClip = useMemo(() => ({ LargeClip: LargeClipCell }), []);

  const {
    confirmClipImgs,
    setConfirmClipImgs,
    currentSelectedPair,
    setCurrentSelectedPair,
    candidateLeftClipImgs,
    setCandidateLeftClipImgs,
    candidateRightClipImgs,
    setCandidateRightClipImgs,
    confirmLargeClipImgs,
    setConfirmLargeClipImgs,
  } = props;

  // const initialNodes = [
  //     {
  //       id: 'node-1',
  //       type: 'textUpdater',
  //       position: { x: 0, y: 0 },
  //       data: { value: 123 },
  //     },
  //   ];

  const clipImgsRef = useRef();

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

  useEffect(() => {
    if (currentSelectedPair) {
      searchCandidateLeftClipImgs(currentSelectedPair);
      searchCandidateRightClipImgs(currentSelectedPair);
    }
  }, [currentSelectedPair]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const nodes = [
    {
      id: "node-1",
      type: "textUpdater",
      position: { x: 0, y: 0 },
      data: { value: 123 },
    },
  ];

  return (
    <>
      <div
        style={{ height: viewHeight }}
        className="w-full flex justify-between items-start"
      >
        <div className="w-[360px] border-dashed border-2 border-sky-500">
          <div
            style={{ height: viewHeight }}
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
            style={{ height: viewHeight }}
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
            style={{ height: viewHeight }}
          >
            {currentSelectedPair && (
              <div
                Key={
                  "confirmClipImgs" + currentSelectedPair.content.at(0).at(0).id
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
            style={{ height: viewHeight }}
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
        <div
          className=" border-dashed border-2 border-green-300"
          style={{ height: viewHeight, width: "calc(100vw - 360px)" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={largeClip}
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </>
  );
}
