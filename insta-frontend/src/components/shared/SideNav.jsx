import React, { useState } from "react";
import { Button, Layout, Menu } from "antd";
import { MdLogout, } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Bot,
  Instagram,
  FileBarChart2,
  LucideInstagram
} from "lucide-react";

const { Sider } = Layout;
const { SubMenu } = Menu;

const MENU_ITEMS = [
  {
    key: "dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
    type: "item",
  },
  {
    key: "automations",
    icon: <Bot size={18} />,
    label: "Automations",
    type: "item",
  },
  {
    key: "instagram",
    icon: <Instagram size={18} />,
    label: "Instagram",
    type: "item",
  },
  {
    key: "reports",
    icon: <FileBarChart2 size={18} />,
    label: "Reports",
    type: "item",
  },
];


const DEFAULT_SIDEBAR_WIDTH = 250;
const MOBILE_COLLAPSED_WIDTH = 60;

export default function Sidebar({ onSelectMenu, selectedKey }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    setOpenKeys(latestOpenKey ? [latestOpenKey] : keys);
  };

  const handleMenuSelect = ({ key }) => {
    onSelectMenu(key);
  };

  const getShadowStyle = () => {
    return window.innerWidth <= 768 && !collapsed ? "0px 0px 1112px 1112px rgb(104, 104, 104, 0.3)" : "none";
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/");
  };

  const renderMenuItem = (item) => {
    if (item.type === "group") {
      return (
        <SubMenu key={item.key} icon={item.icon} title={item.label}>
          {item.children.map((child) => (
            <Menu.Item key={child.key} icon={child.icon}>
              {child.label}
            </Menu.Item>
          ))}
        </SubMenu>
      );
    }
    return (
      <Menu.Item key={item.key} icon={item.icon}>
        {item.label}
      </Menu.Item>
    );
  };

  return (
    <Sider
      width={DEFAULT_SIDEBAR_WIDTH}
      theme="light"
      breakpoint="lg"
      collapsedWidth={MOBILE_COLLAPSED_WIDTH}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapsed}
      style={{
        background: "#f0f2f5",
        boxShadow: getShadowStyle(),
        zIndex: 10,
        position: "relative",
      }}
    >
      <div className="text-center py-2 border-b border-gray-400 bg-white flex items-center justify-center flex-row gap-3">
        <LucideInstagram size={35} className={` p-1 mt-2 rounded bg-pink-500 fill-white stroke-1 stroke-pink-500 mb-1`} />
        {!collapsed && (
          <div className="text-gray-900 text-start m-0">
            <h2 className="text-md md:text-xl font-semibold uppercase">
              InstaBOT
            </h2>
            <p className="text-xs">Dashboard</p>
          </div>
        )}
      </div>

      <Menu
        mode="inline"
        defaultSelectedKeys={["dashboard"]}
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onSelect={handleMenuSelect}
        style={{
          borderRight: 0,
          height: collapsed ? "calc(100vh - 150px)" : "calc(100vh - 150px)",
        }}
        className="flex-grow overflow-y-auto scrollbar"
      >
        {MENU_ITEMS.map(renderMenuItem)}
      </Menu>

      <div className="flex justify-center items-center w-full">
        <Button onClick={handleLogout} style={{ backgroundColor: "#F6339A", borderColor: "#19314B" }} type="primary" icon={<MdLogout size={15} />} className="w-full font-bold">
          {!collapsed && "Logout"}
        </Button>
      </div>
    </Sider>
  );
}
