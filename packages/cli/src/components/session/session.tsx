import { useParams } from "react-router";

export const Session = () => {
  const { id } = useParams();
  return <text>session id : {id} </text>;
};