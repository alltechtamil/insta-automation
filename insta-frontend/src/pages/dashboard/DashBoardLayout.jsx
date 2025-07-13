import React, { useState } from "react";
import { Layout, Badge, Avatar } from "antd";
import { BellOutlined, LoginOutlined, UserOutlined } from "@ant-design/icons";
import Sidebar from "../../components/shared/SideNav";
import Content from "../../components/shared/Content";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const { Header, Content: AntdContent } = Layout;

const DashBoardLayout = () => {
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const navigate = useNavigate();

  const handleMenuClick = (menuKey) => {
    setSelectedMenu(menuKey);
  };


  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <Layout className="h-screen rounded-lg bg-[#F5F5F5] overflow-hidden shadow-lg md:p-1 p-0">
      <Sidebar onSelectMenu={handleMenuClick} selectedKey={selectedMenu} />
      <Layout className="md:m-2 m-0.5 rounded-lg overflow-hidden">
        <Header style={{ background: "#F6339A", color: "black" }} className='px-3 text-white text-center flex items-center justify-center rounded-lg mb-2 shadow-lg min-h-[8px] md:min-h-[100px]'>
          <h1 className='text-gray-100 shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] md:text-2xl font-bold m-0'>
            Instagram Automation
          </h1>
        </Header>
        <AntdContent className="rounded-b-lg overflow-hidden p-0 bg-white">
          <Content selectedMenu={selectedMenu} onMenuChange={(menuKey) => setSelectedMenu(menuKey)} />
        </AntdContent>
      </Layout>
    </Layout>
  );
};

export default DashBoardLayout;
