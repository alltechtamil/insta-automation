import React from "react";
import { Layout } from "antd";
import DashboardContents from "../../pages/dashboard/DashboardContents";
import AutomationsPage from "../../pages/dashboard/automations/AutomationsPage";
import InstagramProfilePage from "../../pages/dashboard/instagram/InstagramProfilePage";
import DmLogsPage from '../../pages/dashboard/DmLogsPage';
const { Content: AntContent } = Layout;

const Content = ({ selectedMenu, onMenuChange }) => {
  let content;
  switch (selectedMenu) {
    case "dashboard":
      content = <DashboardContents onMenuChange={onMenuChange} />;
      break;
    case "automations":
      content = <AutomationsPage />;
      break;
    case "instagram":
      content = <InstagramProfilePage />;
      break;
    case "reports":
      content = <DmLogsPage />;
      break;
    default:
      content = <DashboardContents onMenuChange={onMenuChange} />;
  }

  return (
    <AntContent className="thumb-control" style={{ padding: "6px", height: "85vh", overflow: "auto" }}>
      {content}
    </AntContent>
  );
};

export default Content;
