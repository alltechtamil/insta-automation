import React, { useEffect, useState } from 'react';
import { Card, Button, Avatar, Typography, Space, Spin } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import InstagramConfigForm from './component/InstagramConfigForm';
import axios from '../../../lib/axios';

const { Text } = Typography;

const InstagramProfilePage = () => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [profile, setProfile] = useState(null);
    const [config, setConfig] = useState(null);

    // Fetch user profile
    const fetchProfile = async () => {
        setFetching(true);
        try {
            const res = await axios.get('/auth/profile');
            console.log("%c Line:21 🍺 res", "color:#ea7e5c", res);
            const { username, name, profile_picture_url } = res.data;
            setProfile({
                username,
                name,
                profilePic: profile_picture_url,
            });
        } catch (err) {
            toast.error('Failed to load profile');
            setProfile(null);
        } finally {
            setFetching(false);
        }
    };

    // Fetch config
    const fetchConfig = async () => {
        try {
            const res = await axios.get('/fb-token');
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
        toast.success('Disconnected');
        // optionally: call DELETE /fb-token
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        try {
            await axios.put('/fb-token', formData);
            toast.success('Configuration saved successfully');
            setConfig(formData); // Update local state
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchConfig();
    }, []);

    console.log('fetching: ', fetching);
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
        <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
                Connected Account
            </Text>

            <Card style={{ borderRadius: 12 }}>
                <Space direction="horizontal" align="center" size="large">
                    <Avatar size={64} src={profile.profilePic} />
                    <div>
                        <Text strong style={{ fontSize: 18 }}>{profile.name}</Text>
                        <br />
                        <Text type="secondary">@{profile.username}</Text>
                    </div>
                </Space>

                <div style={{ marginTop: 16 }}>
                    <Space>
                        <Button danger icon={<DeleteOutlined />} onClick={handleRemove}>
                            Logout
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchProfile}>
                            Refresh
                        </Button>
                    </Space>
                </div>
            </Card>

            <InstagramConfigForm
                initialValues={config || {}}
                onSubmit={handleSubmit}
                loading={loading}
                mode={config ? 'edit' : 'create'}
            />
        </div>
    );
};

export default InstagramProfilePage;
