import { memo } from "react";

const TransformationHeader = memo(() => (
  <h2 className="text-xl font-semibold text-center mb-6">Transformation Station</h2>
));

TransformationHeader.displayName = "TransformationHeader";
export default TransformationHeader;