import React from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';

const { Title } = Typography;

const InstagramConfigForm = ({ initialValues = {}, onSubmit, loading }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        if (onSubmit) onSubmit(values);
    };

    return (
        <Card title={<Title level={5}>Facebook / Instagram Configuration</Title>} style={{ marginTop: 24 }}>
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={handleFinish}
            >
                <Form.Item
                    label="Facebook User ID"
                    name="facebookUserId"
                    rules={[{ required: true, message: 'Facebook User ID is required' }]}
                >
                    <Input placeholder="e.g. 10203040506070809" />
                </Form.Item>

                <Form.Item
                    label="Facebook Long Access Token"
                    name="fbLongAccessToken"
                    rules={[{ required: true, message: 'Token is required' }]}
                >
                    <Input.TextArea rows={2} placeholder="Paste your long-lived FB access token" />
                </Form.Item>

                <Form.Item
                    label="Page Long Access Token"
                    name="pageLongAccessToken"
                    rules={[{ required: true, message: 'Page token is required' }]}
                >
                    <Input.TextArea rows={2} placeholder="Paste your page access token" />
                </Form.Item>

                <Form.Item
                    label="Instagram Account ID"
                    name="instagramAccountId"
                    rules={[{ required: true, message: 'Instagram Account ID is required' }]}
                >
                    <Input placeholder="e.g. 17841412345678901" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Save Configuration
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default InstagramConfigForm;
