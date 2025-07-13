// src/pages/dashboard/logs/DmLogsPage.jsx
import React, { useEffect, useState } from "react";
import { Table, Card, Typography, Input, DatePicker, Space, Tag } from "antd";
import axios from "../../lib/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const DmLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/dm-log");
      console.log("res: ", res.data);
      setLogs(res.data);
    } catch (err) {
      toast.error("Failed to load DM logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchSearch = (log.message ?? "").toLowerCase().includes(search.toLowerCase());

    const matchDate = !dateRange.length || (dayjs(log.sentAt).isAfter(dayjs(dateRange[0])) && dayjs(log.sentAt).isBefore(dayjs(dateRange[1]).endOf("day")));

    return matchSearch && matchDate;
  });

  const columns = [
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
    },
    {
      title: "Status",
      dataIndex: "sent",
      key: "sent",
      render: (sent) => <Tag color={sent === true ? "green" : "red"}>{sent === true ? "Sent" : "Failed"}</Tag>,
    },
    {
      title: "Sent At",
      dataIndex: "sentAt",
      key: "sentAt",
      render: (value) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Media ID",
      dataIndex: "mediaId",
      key: "mediaId",
      ellipsis: true,
    },
    {
      title: "Automation ID",
      dataIndex: "automationId",
      key: "automationId",
      ellipsis: true,
    },
  ];

  return (
    <Card>
      <Title level={3}>DM Logs</Title>

      <Space style={{ marginBottom: 16 }} direction="horizontal">
        <Input.Search placeholder="Search by message" allowClear onSearch={(v) => setSearch(v)} style={{ width: 250 }} />
        <RangePicker onChange={(dates) => setDateRange(dates)} style={{ width: 300 }} />
      </Space>

      <Table rowKey="_id" columns={columns} dataSource={filteredLogs} loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
    </Card>
  );
};

export default DmLogsPage;
