import React from "react";
import { Modal, Descriptions, Tag, Typography, Space, Tooltip, Divider, Alert } from "antd";
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  CommentOutlined,
  EyeOutlined,
  CalendarOutlined,
  InboxOutlined,
  NumberOutlined,
  PauseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const AutomationViewModal = ({ visible, onCancel, automation }) => {
  if (!automation) return null;

  const formatDate = (date) => (date ? dayjs(date).format("DD MMM YYYY, HH:mm") : "N/A");

  // Check if automation is currently paused
  const isPaused = automation.pausedUntil && dayjs().isBefore(dayjs(automation.pausedUntil));

  // Check if there are any errors
  const hasErrors = automation.lastDMErrorAt || automation.lastReplyErrorAt;

  // Get status details
  const getStatusDetails = () => {
    if (!automation.isEnabled) {
      return {
        text: "Disabled",
        color: "red",
        icon: <PauseCircleOutlined />,
      };
    }

    if (isPaused) {
      return {
        text: "Paused",
        color: "orange",
        icon: <PauseCircleOutlined />,
      };
    }

    return {
      text: "Active",
      color: "green",
      icon: <CheckCircleOutlined />,
    };
  };

  const status = getStatusDetails();

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
      {isPaused && (
        <Alert
          message="Automation Paused"
          description={
            <Space direction="vertical">
              <Text>
                <strong>Reason:</strong> {automation.lastViolationMessage || "Policy violation"}
              </Text>
              <Text>
                <strong>Resumes:</strong> {formatDate(automation.pausedUntil)}
              </Text>
            </Space>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {hasErrors && (
        <Alert message="Recent Errors Detected" description="This automation has encountered errors during execution" type="error" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }} />
      )}

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item
          label={
            <Space>
              <InboxOutlined /> Post ID
            </Space>
          }
        >
          <Text code>{automation.mediaId}</Text>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <CommentOutlined /> Post Caption
            </Space>
          }
        >
          {automation.postCaption || "N/A"}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <MessageOutlined /> DM Message
            </Space>
          }
        >
          {automation.replyMessage || "N/A"}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <CommentOutlined /> Public Comment Reply
            </Space>
          }
        >
          {automation.replyComment || "N/A"}
        </Descriptions.Item>

        <Descriptions.Item label="Keywords">
          {automation.keywords?.length > 0
            ? automation.keywords.map((kw, i) => (
                <Tag key={i} color="blue">
                  {kw}
                </Tag>
              ))
            : "N/A"}
        </Descriptions.Item>

        <Descriptions.Item label="Send DM">
          <Tag color={automation.isDM ? "green" : "red"}>{automation.isDM ? "Yes" : "No"}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Send Comment Reply">
          <Tag color={automation.isReply ? "green" : "red"}>{automation.isReply ? "Yes" : "No"}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Automation Status">
          <Tag icon={status.icon} color={status.color}>
            {status.text}
          </Tag>
          {isPaused && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Paused until: {formatDate(automation.pausedUntil)}
              </Text>
            </div>
          )}
        </Descriptions.Item>

        <Descriptions.Item label={<NumberOutlined />}>
          <Space>
            Max Replies:
            <Text>{automation.maxReplies ?? "No Limit"}</Text>
          </Space>
          <br />
          <Space>
            Max DMs:
            <Text>{automation.maxDMs ?? "No Limit"}</Text>
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

        <Descriptions.Item label="Error Tracking">
          <Space direction="vertical">
            <div>
              <Text>Last DM Error:</Text> {automation.lastDMErrorAt ? <Text type="danger">{formatDate(automation.lastDMErrorAt)}</Text> : <Text type="success">None</Text>}
            </div>
            <div>
              <Text>Last Reply Error:</Text> {automation.lastReplyErrorAt ? <Text type="danger">{formatDate(automation.lastReplyErrorAt)}</Text> : <Text type="success">None</Text>}
            </div>
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

        <Descriptions.Item label="Last Updated">{formatDate(automation.updatedAt)}</Descriptions.Item>
      </Descriptions>

      {automation.lastViolationMessage && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Violation Details:</Text>
          <div
            style={{
              background: "#fffbe6",
              padding: 8,
              borderRadius: 4,
              marginTop: 8,
            }}
          >
            <Text type="warning">{automation.lastViolationMessage}</Text>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AutomationViewModal;
