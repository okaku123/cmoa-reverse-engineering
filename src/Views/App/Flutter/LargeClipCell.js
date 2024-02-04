import { useCallback } from "react";
import { Handle, Position } from "reactflow";

export default function LargeClipCell({ data }) {
  const { content } = data;
  const { lt, rt, lb, rb } = content;

  return (
    <div style={{ fontSize: 9 }} className="grid grid-cols-2 gap-0">
      <img className="w-20" src={lt.url}></img>
      <img className="w-20" src={rt.url}></img>
      <img className="w-20" src={lb.url}></img>
      <img className="w-20" src={rb.url}></img>
    </div>
  );
}
