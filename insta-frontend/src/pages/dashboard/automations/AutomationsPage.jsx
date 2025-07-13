// src/pages/dashboard/automations/AutomationsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Input, Row, Col, Typography, Select, Switch, List, Space, Tag, Tooltip, message } from "antd";
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import axios from "../../../lib/axios";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
import AutomationFormModal from "./components/AutomationFormModal";
import AutomationViewModal from "./components/AutomationViewModal";

const { Title, Text } = Typography;
const { Option } = Select;

const AutomationsPage = () => {
  const [automations, setAutomations] = useState([]);
  const [filteredAutomations, setFilteredAutomations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAutomation, setSelectedAutomation] = useState(null);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, data: null });
  const [loading, setLoading] = useState(false);

  const fetchAutomations = async () => {
    try {
      const res = await axios.get("/automated-post");
      setAutomations(res.data);
    } catch (error) {
      toast.error("Failed to fetch automations");
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  useEffect(() => {
    let data = [...automations];

    if (search) {
      data = data.filter((a) => a.replyMessage.toLowerCase().includes(search.toLowerCase()));
    }

    if (statusFilter === "active") {
      data = data.filter((a) => a.isEnabled);
    } else if (statusFilter === "inactive") {
      data = data.filter((a) => !a.isEnabled);
    }

    data = data.sort((a, b) => {
      const dA = new Date(a.createdAt);
      const dB = new Date(b.createdAt);
      return sortBy === "newest" ? dB - dA : dA - dB;
    });

    setFilteredAutomations(data);
  }, [automations, search, statusFilter, sortBy]);

  const handleModalSubmit = async (formData) => {
    try {
      setLoading(true);
      if (modalMode === "edit") {
        await axios.put(`/automated-post/${selectedAutomation._id}`, formData);
        toast.success("Automation updated");
      } else {
        await axios.post("/automated-post", formData);
        toast.success("Automation created");
      }
      fetchAutomations();
      setIsModalVisible(false);
    } catch (err) {
      toast.error("Error saving automation");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`/automated-post/${id}/toggle`);
      fetchAutomations();
    } catch (err) {
      toast.error("Failed to toggle automation");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/automated-post/${deleteModal.data._id}`);
      toast.success("Automation deleted");
      fetchAutomations();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteModal({ visible: false, data: null });
    }
  };

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>Automations</Title>
          <Text type="secondary">Create and manage your Instagram DM & Comment automations</Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setModalMode("create");
                setSelectedAutomation(null);
                setIsModalVisible(true);
              }}
            >
              Comment Automation
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Input.Search placeholder="Search by reply message..." allowClear onSearch={setSearch} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }}>
            <Option value="all">All</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select value={sortBy} onChange={setSortBy} style={{ width: "100%" }}>
            <Option value="newest">Newest first</Option>
            <Option value="oldest">Oldest first</Option>
          </Select>
        </Col>
      </Row>

      {/* Automation List */}
      <List
        dataSource={filteredAutomations}
        renderItem={(item) => (
          <Card style={{ marginBottom: 16 }} className="cursor-pointer shadow-md">
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical">
                  <h1 className="text-xl font-bold">{item.postCaption.length > 50 ? `${item.postCaption.slice(0, 50)}...` : item.postCaption}</h1>
                  <Text type="secondary">Keywords: {item.keywords.join(", ")}</Text>
                  <Text type="secondary">
                    {item.isReply && "Auto-Reply + "} {item.isDM && "DM"}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Tag color={item.isEnabled ? "green" : "default"}>{item.isEnabled ? "Active" : "Inactive"}</Tag>
                  <Switch checked={item.isEnabled} onChange={() => handleToggleStatus(item._id)} />
                  <Tooltip title="Edit Automation">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => {
                        setSelectedAutomation(item);
                        setModalMode("edit");
                        setIsModalVisible(true);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="View Automation">
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedAutomation(item);
                        setViewModalVisible(true);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Delete Automation">
                    <Button icon={<DeleteOutlined />} danger onClick={() => setDeleteModal({ visible: true, data: item })} />
                  </Tooltip>
                </Space>
              </Col>
            </Row>
          </Card>
        )}
      />

      {/* Form Modal */}
      <AutomationFormModal
        mode={modalMode}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        automation={selectedAutomation}
        onSubmit={handleModalSubmit}
        loading={loading}
        error={null}
      />

      {/* View Modal */}
      <AutomationViewModal visible={viewModalVisible} onCancel={() => setViewModalVisible(false)} automation={selectedAutomation} />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        visible={deleteModal.visible}
        onCancel={() => setDeleteModal({ visible: false, data: null })}
        onConfirm={handleDelete}
        title={`Delete Automation: ${deleteModal.data?.postCaption || ""}`}
        content="Are you sure you want to permanently delete this automation? This action cannot be undone."
      />
    </Card>
  );
};

export default AutomationsPage;
