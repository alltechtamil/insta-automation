import React from 'react';
import {
    Modal,
    Descriptions,
    Tag,
    Typography,
    Space,
    Tooltip,
    Divider
} from 'antd';
import {
    ThunderboltOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    MessageOutlined,
    CommentOutlined,
    EyeOutlined,
    CalendarOutlined,
    InboxOutlined,
    NumberOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AutomationViewModal = ({ visible, onCancel, automation }) => {
    if (!automation) return null;

    const formatDate = (date) =>
        date ? dayjs(date).format('DD MMM YYYY, HH:mm') : 'N/A';

    return (
        <Modal
            title={
                <Title level={4}>
                    <ThunderboltOutlined style={{ marginRight: 8 }} />
                    Automation Details
                </Title>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={700}
            centered
        >
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={<Space><InboxOutlined /> Post ID</Space>}>
                    <Text code>{automation.mediaId}</Text>
                </Descriptions.Item>

                <Descriptions.Item label={<Space><CommentOutlined /> Post Caption</Space>}>
                    {automation.postCaption || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label={<Space><MessageOutlined /> DM Message</Space>}>
                    {automation.replyMessage || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label={<CommentOutlined />} Public Comment Reply>
                    {automation.replyComment || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Keywords">
                    {automation.keywords?.length > 0
                        ? automation.keywords.map((kw, i) => (
                            <Tag key={i} color="blue">{kw}</Tag>
                        ))
                        : 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Send DM">
                    <Tag color={automation.isDM ? 'green' : 'red'}>
                        {automation.isDM ? 'Yes' : 'No'}
                    </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Send Comment Reply">
                    <Tag color={automation.isReply ? 'green' : 'red'}>
                        {automation.isReply ? 'Yes' : 'No'}
                    </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Automation Status">
                    <Tag color={automation.isEnabled ? 'green' : 'red'}>
                        {automation.isEnabled ? 'Active' : 'Inactive'}
                    </Tag>
                </Descriptions.Item>

                <Descriptions.Item label={<NumberOutlined />}>
                    <Space>
                        Max Replies:
                        <Text>{automation.maxReplies ?? 'No Limit'}</Text>
                    </Space>
                    <br />
                    <Space>
                        Max DMs:
                        <Text>{automation.maxDMs ?? 'No Limit'}</Text>
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label={<EyeOutlined />} Sent Summary>
                    <Space>
                        Replies Sent:
                        <Text strong>{automation.sentReplies}</Text>
                    </Space>
                    <br />
                    <Space>
                        DMs Sent:
                        <Text strong>{automation.sentDMs}</Text>
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label={<ClockCircleOutlined />} Duration>
                    <Space>
                        Start:
                        {formatDate(automation.startDate)}
                    </Space>
                    <br />
                    <Space>
                        End:
                        {formatDate(automation.endDate)}
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label={<CalendarOutlined />} Created At>
                    {formatDate(automation.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                    {formatDate(automation.updatedAt)}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default AutomationViewModal;
