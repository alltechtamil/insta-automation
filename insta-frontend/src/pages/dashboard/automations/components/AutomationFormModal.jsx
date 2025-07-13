import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Select, InputNumber, DatePicker, Divider, Spin } from "antd";
import axios from "../../../../lib/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

const AutomationFormModal = ({ mode, visible, onCancel, onSubmit, automation = {}, loading }) => {
  const [form] = Form.useForm();
  const [mediaOptions, setMediaOptions] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

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
      });
    } else {
      form.resetFields();
    }
  }, [automation, visible]);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const res = await axios.get("/media/details");
      const items = res.data?.media?.data || [];
      console.log("items: ", items);
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
    };
    onSubmit(data);
  };

  return (
    <Modal
      title={mode === "edit" ? "Edit Automation" : "New Automation"}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={mode === "edit" ? "Update" : "Create"}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{
          isReply: true,
          isDM: true,
          isEnabled: true,
        }}
      >
        <Form.Item label="Select Instagram Post" name="mediaId" rules={[{ required: true, message: "Post is required" }]}>
          <Select showSearch placeholder="Choose a post" loading={loadingMedia} onChange={handleMediaChange} optionLabelProp="label">
            {mediaOptions.map((item) => (
              <Option key={item.id} value={item.id} label={item.caption || "(No Caption)"}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    padding: 16,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    gap: 16,
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    // marginBottom: 12,
                  }}
                >
                  {/* Media Thumbnail */}
                  <div style={{ flexShrink: 0 }}>
                    {item.media_type === "VIDEO" ? (
                      <video src={item.media_url} poster={item.thumbnail_url} width={100} height={100} style={{ borderRadius: 8, objectFit: "cover" }} muted autoPlay loop />
                    ) : (
                      <img src={item.media_url} alt="media" width={100} height={100} style={{ borderRadius: 8, objectFit: "cover" }} />
                    )}
                  </div>

                  {/* Media Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 6,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.caption}
                    >
                      {item.caption || "(No Caption)"}
                    </div>

                    <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
                      <strong>Type:</strong> {item.media_type} &nbsp; | &nbsp;
                      <strong>ID:</strong> {item.id}
                    </div>

                    <div style={{ fontSize: 12, color: "#999" }}>
                      <strong>Likes:</strong> {item.like_count} &nbsp; | &nbsp;
                      <strong>Comments:</strong> {item.comments_count}
                    </div>

                    {/* Comments Preview */}
                    {item.comments?.data?.length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          maxHeight: 100,
                          overflowY: "auto",
                          paddingLeft: 8,
                          borderLeft: "2px solid #eee",
                        }}
                      >
                        {item.comments.data.slice(0, 5).map((comment) => (
                          <div key={comment.id} style={{ marginBottom: 6 }}>
                            <span style={{ fontWeight: 500 }}>{comment.from.username}</span>: <span style={{ color: "#333" }}>{comment.text}</span>
                          </div>
                        ))}
                        {item.comments.data.length > 5 && <div style={{ fontSize: 12, color: "#888" }}>+{item.comments.data.length - 5} more comments</div>}
                      </div>
                    )}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Post Caption" name="postCaption" rules={[{ required: true, message: "Caption is required" }]}>
          <Input disabled placeholder="Auto-filled from post" />
        </Form.Item>

        <Form.Item label="Keywords (comma separated)" name="keywords" rules={[{ required: true, message: "At least one keyword is required" }]}>
          <Select mode="tags" tokenSeparators={[","]} placeholder="hello, offer, support" />
        </Form.Item>

        <Form.Item label="Reply Message" name="replyMessage" rules={[{ required: true, message: "Reply message is required" }]}>
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Reply Comment (optional)" name="replyComment">
          <Input />
        </Form.Item>

        <Divider orientation="left">Limits</Divider>

        <Form.Item label="Max Replies" name="maxReplies">
          <InputNumber min={0} placeholder="Unlimited if empty" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Max DMs" name="maxDMs">
          <InputNumber min={0} placeholder="Unlimited if empty" style={{ width: "100%" }} />
        </Form.Item>

        <Divider orientation="left">Time Range</Divider>

        <Form.Item label="Start Date" name="startDate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="End Date" name="endDate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Divider orientation="left">Flags</Divider>

        <Form.Item label="Enable Automation" name="isEnabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Enable Auto Reply" name="isReply" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Enable Direct Message" name="isDM" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AutomationFormModal;
