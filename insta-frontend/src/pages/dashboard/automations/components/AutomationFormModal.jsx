import React, { useEffect, useState } from "react";
import { 
  Modal, 
  Form, 
  Input, 
  Switch, 
  Select, 
  InputNumber, 
  DatePicker, 
  Divider, 
  Spin,
  Alert,
  Tabs,
  Card,
  Tag,
  Row,
  Col
} from "antd";
import axios from "../../../../lib/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const AutomationFormModal = ({ mode, visible, onCancel, onSubmit, automation = {}, loading }) => {
  const [form] = Form.useForm();
  const [mediaOptions, setMediaOptions] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [showErrorResolved, setShowErrorResolved] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchMedia();
    }
  }, [visible]);

  useEffect(() => {
    if (automation && mode === "edit") {
      form.setFieldsValue({
        ...automation,
        startDate: automation.startDate ? dayjs(automation.startDate) : null,
        endDate: automation.endDate ? dayjs(automation.endDate) : null,
        isErrorResolved: automation.isErrorResolved || false
      });
      
      // Determine if we should show the error resolved toggle
      const hasErrors = automation.lastDMErrorAt || automation.lastReplyErrorAt;
      setShowErrorResolved(hasErrors);
      
      // Show advanced tab if editing an existing automation
      setActiveTab("2");
    } else {
      form.resetFields();
      setActiveTab("1");
      setShowErrorResolved(false);
    }
  }, [automation, visible]);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await axios.get("/media/details");
      const items = res.data?.media?.data || [];
      setMediaOptions(items);
    } catch (err) {
      toast.error("Failed to fetch media");
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleMediaChange = (selectedId) => {
    const media = mediaOptions.find((m) => m.id === selectedId);
    if (media?.caption) {
      form.setFieldsValue({ postCaption: media.caption });
    } else {
      form.setFieldsValue({ postCaption: "" });
    }
  };

  const handleFinish = (values) => {
    const data = {
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : null,
      endDate: values.endDate ? values.endDate.toISOString() : null,
      
      // Reset error flags if user marks as resolved
      ...(values.isErrorResolved && {
        lastDMErrorAt: null,
        lastReplyErrorAt: null,
        lastViolationMessage: null,
        pausedUntil: null
      })
    };
    onSubmit(data);
  };

  const renderMediaPreview = (item) => (
    <Card
      size="small"
      style={{ marginTop: 8, border: "1px solid #f0f0f0" }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        {/* Media Thumbnail */}
        <div style={{ flexShrink: 0 }}>
          {item.media_type === "VIDEO" ? (
            <video 
              src={item.media_url} 
              poster={item.thumbnail_url} 
              width={80} 
              height={80} 
              style={{ borderRadius: 6, objectFit: "cover" }} 
              muted 
              autoPlay 
              loop 
            />
          ) : (
            <img 
              src={item.media_url} 
              alt="media" 
              width={80} 
              height={80} 
              style={{ borderRadius: 6, objectFit: "cover" }} 
            />
          )}
        </div>

        {/* Media Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {item.caption ? (
              <div style={{ 
                whiteSpace: "nowrap", 
                overflow: "hidden", 
                textOverflow: "ellipsis" 
              }}>
                {item.caption}
              </div>
            ) : (
              <span style={{ color: "#999" }}>(No Caption)</span>
            )}
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag color="blue">ID: {item.id}</Tag>
            <Tag color={item.media_type === "IMAGE" ? "green" : "orange"}>
              {item.media_type}
            </Tag>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <Modal
      title={mode === "edit" ? "Edit Automation" : "New Automation"}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={mode === "edit" ? "Update" : "Create"}
      width={700}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{
          isReply: true,
          isDM: true,
          isEnabled: true,
          maxReplies: null,
          maxDMs: null,
          isErrorResolved: false
        }}
      >
        {mode === "edit" && automation.pausedUntil && (
          <Alert
            message="Automation Paused"
            description={
              <>
                <p>This automation is paused due to: {automation.lastViolationMessage || 'policy violation'}</p>
                <p>
                  <strong>Resumes:</strong> {dayjs(automation.pausedUntil).format('DD MMM YYYY, HH:mm')}
                </p>
              </>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        {mode === "edit" && showErrorResolved && (
          <Alert
            message="Error Resolution"
            description={
              <Form.Item 
                name="isErrorResolved"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
                tooltip="Mark this when you've resolved the underlying issue"
              >
                <Switch 
                  checkedChildren="Error Resolved" 
                  unCheckedChildren="Error Pending" 
                />
              </Form.Item>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Basic Settings" key="1">
            <Form.Item 
              label="Select Instagram Post" 
              name="mediaId" 
              rules={[{ required: true, message: "Post is required" }]}
            >
              <Select 
                showSearch 
                placeholder="Choose a post" 
                loading={loadingMedia} 
                onChange={handleMediaChange}
                optionLabelProp="label"
                dropdownRender={(menu) => (
                  <Spin spinning={loadingMedia}>
                    {menu}
                  </Spin>
                )}
              >
                {mediaOptions.map((item) => (
                  <Option key={item.id} value={item.id} label={item.caption || "(No Caption)"}>
                    {renderMediaPreview(item)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              label="Post Caption" 
              name="postCaption" 
              rules={[{ required: true, message: "Caption is required" }]}
            >
              <Input disabled placeholder="Auto-filled from post" />
            </Form.Item>

            <Form.Item 
              label="Keywords (comma separated)" 
              name="keywords" 
              rules={[{ required: true, message: "At least one keyword is required" }]}
              tooltip="Automation will trigger when any of these keywords are found in comments"
            >
              <Select 
                mode="tags" 
                tokenSeparators={[","]} 
                placeholder="hello, offer, support" 
              />
            </Form.Item>

            <Form.Item 
              label="Reply Message" 
              name="replyMessage" 
              rules={[{ required: true, message: "Reply message is required" }]}
              tooltip="This message will be sent via Direct Message"
            >
              <TextArea rows={3} placeholder="Hi! Thanks for commenting..." />
            </Form.Item>

            <Form.Item 
              label="Reply Comment (optional)" 
              name="replyComment"
              tooltip="Public reply to the comment (leave blank to use same as DM message)"
            >
              <Input placeholder="Public reply text..." />
            </Form.Item>
          </TabPane>

          <TabPane tab="Advanced Settings" key="2">
            <Divider orientation="left">Limits</Divider>
            
            <Form.Item 
              label="Max Replies" 
              name="maxReplies"
              tooltip="Maximum number of public replies to send (leave empty for unlimited)"
            >
              <InputNumber 
                min={0} 
                placeholder="Unlimited if empty" 
                style={{ width: "100%" }} 
              />
            </Form.Item>

            <Form.Item 
              label="Max DMs" 
              name="maxDMs"
              tooltip="Maximum number of direct messages to send (leave empty for unlimited)"
            >
              <InputNumber 
                min={0} 
                placeholder="Unlimited if empty" 
                style={{ width: "100%" }} 
              />
            </Form.Item>

            <Divider orientation="left">Time Range</Divider>

            <Form.Item 
              label="Start Date" 
              name="startDate"
              tooltip="Automation will only run after this date"
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                style={{ width: "100%" }} 
              />
            </Form.Item>

            <Form.Item 
              label="End Date" 
              name="endDate"
              tooltip="Automation will stop running after this date"
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                style={{ width: "100%" }} 
              />
            </Form.Item>

            <Divider orientation="left">Features</Divider>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  label="Enable Automation" 
                  name="isEnabled" 
                  valuePropName="checked"
                  tooltip="Turn this automation on/off"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Auto Reply" 
                  name="isReply" 
                  valuePropName="checked"
                  tooltip="Send public replies"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  label="Direct Message" 
                  name="isDM" 
                  valuePropName="checked"
                  tooltip="Send private messages"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default AutomationFormModal;