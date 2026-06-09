import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import type { Property } from '../types/graph';

interface AddEntityModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddEntityModal: React.FC<AddEntityModalProps> = ({ visible, onClose }) => {
  const { state, actions } = useGraph();
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const properties: Property[] = (values.properties || [])
        .filter((p: any) => p && p.key?.trim())
        .map((p: any) => ({ key: p.key.trim(), value: p.value || '' }));

      await actions.addEntity({
        typeId: values.typeId,
        label: values.label.trim(),
        properties,
      });
      message.success('实体已添加');
      form.resetFields();
      onClose();
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title="添加实体"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="添加"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ typeId: 'person' }}>
        <Form.Item
          name="label"
          label="名称"
          rules={[{ required: true, message: '请输入实体名称' }]}
        >
          <Input placeholder="实体名称" />
        </Form.Item>
        <Form.Item
          name="typeId"
          label="类型"
          rules={[{ required: true, message: '请选择实体类型' }]}
        >
          <Select>
            {state.entityTypes.map((type) => (
              <Select.Option key={type.id} value={type.id}>
                <Space>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: type.color,
                    }}
                  />
                  {type.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.List name="properties">
          {(fields, { add, remove }) => (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span>属性</span>
                <Button size="small" icon={<PlusOutlined />} onClick={() => add()}>
                  添加属性
                </Button>
              </div>
              {fields.map(({ key, name, ...rest }) => (
                <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Form.Item {...rest} name={[name, 'key']} style={{ flex: 1, marginBottom: 0 }}>
                    <Input placeholder="属性名" size="small" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'value']} style={{ flex: 1, marginBottom: 0 }}>
                    <Input placeholder="属性值" size="small" />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default AddEntityModal;
