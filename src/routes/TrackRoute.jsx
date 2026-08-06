import GameContainer from "../pages/GameContainer";


export default function TrackRoute() {

  const token = window.location.pathname.split('/')[2];

  console.log("TRACK TOKEN:", token);


  return (
    <GameContainer
      mode="track"
      token={token}
    />
  );
}