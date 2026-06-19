import HomeView from "./views/HomeView.vue";
import VideoModeView from "./views/VideoModeView.vue";

const routes = [
  { path: "/", component: HomeView },
  { path: "/video", component: VideoModeView, name: "videoMode" },
];

export default routes;
