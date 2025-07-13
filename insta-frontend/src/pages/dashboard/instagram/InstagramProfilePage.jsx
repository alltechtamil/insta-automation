import React, { useEffect, useState } from "react";
import { Card, Button, Avatar, Typography, Space, Spin } from "antd";
import { DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import InstagramConfigForm from "./component/InstagramConfigForm";
import axios from "../../../lib/axios";

const { Text } = Typography;

const InstagramProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const fetchProfile = async () => {
    setFetching(true);
    try {
      const res = await axios.get("/auth/profile");
      const { username, name, profile_picture_url, followers_count, follows_count, media_count, account_type, id } = res.data;

      setProfile({
        username,
        name,
        profilePic: profile_picture_url,
        followersCount: followers_count,
        followsCount: follows_count,
        mediaCount: media_count,
        accountType: account_type,
        id,
      });
    } catch (err) {
      toast.error("Failed to load profile");
      setProfile(null);
    } finally {
      setFetching(false);
    }
  };

  // Fetch config
  const fetchConfig = async () => {
    try {
      const res = await axios.get("/fb-token");
      console.log("%c Line:43 🍓 res", "color:#e41a6a", res);
      const { facebookUserId, fbLongAccessToken, pageLongAccessToken, instagramAccountId } = res.data;
      setConfig({
        facebookUserId,
        fbLongAccessToken,
        pageLongAccessToken,
        instagramAccountId,
      });
    } catch (err) {
      setConfig(null); // No config yet
    }
  };

  const handleRemove = () => {
    setProfile(null);
    setConfig(null);
    toast.success("Disconnected");
    // optionally: call DELETE /fb-token
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await axios.put("/fb-token", formData);
      toast.success("Configuration saved successfully");
      setConfig(formData); // Update local state
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchConfig();
  }, []);

  console.log("fetching: ", fetching);
  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return <Text type="secondary">No account connected</Text>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
      <Text strong style={{ fontSize: 16, display: "block", marginBottom: 16 }}>
        Connected Account
      </Text>

      <Space align="start" size="large" className='bg-gray-100 ring p-3 rounded-lg shadow-lg'>
        <Avatar size={64} src={profile.profilePic} />
        <div>
          <Text strong style={{ fontSize: 18 }}>
            {profile.name}
          </Text>
          <br />
          <Text type="secondary">@{profile.username}</Text>

          <div style={{ marginTop: 12 }}>
            <Space size="middle">
              <Text>
                👥 <strong>{profile.followersCount}</strong> Followers
              </Text>
              <Text>
                🔁 <strong>{profile.followsCount}</strong> Following
              </Text>
              <Text>
                📸 <strong>{profile.mediaCount}</strong> Posts
              </Text>
            </Space>
          </div>

          <div style={{ marginTop: 8 }}>
            <Text>
              🏷️ <strong>Account Type:</strong> {profile.accountType}
            </Text>
          </div>

          <div style={{ marginTop: 4 }}>
            <Text>
              🆔 <strong>ID:</strong> {profile.id}
            </Text>
          </div>
        </div>
      </Space>

      <InstagramConfigForm initialValues={config || {}} onSubmit={handleSubmit} loading={loading} mode={config ? "edit" : "create"} />
    </div>
  );
};

export default InstagramProfilePage;
