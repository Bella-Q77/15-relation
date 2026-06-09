import React from 'react';
import { Modal, Form, Input, Select, Switch, Space, Button, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import type { Property } from '../types/graph';

interface AddEdgeModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddEdgeModal: React.FC<AddEdgeModalProps> = ({ visible, onClose }) => {
  const { state, actions } = useGraph();
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.source === values.target) {
        message.warning('起点和终点不能相同');
        return;
      }
      const properties: Property[] = (values.properties || [])
        .filter((p: any) => p && p.key?.trim())
        .map((p: any) => ({ key: p.key.trim(), value: p.value || '' }));

      await actions.addRelationship({
        source: values.source,
        target: values.target,
        typeId: values.typeId,
        label: values.label?.trim() || '',
        properties,
        directed: values.directed || false,
      });
      message.success('关系已添加');
      form.resetFields();
      onClose();
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title="添加关系"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="添加"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ typeId: 'associate', directed: false }}>
        <Form.Item
          name="source"
          label="起点实体"
          rules={[{ required: true, message: '请选择起点' }]}
        >
          <Select showSearch optionFilterProp="children" placeholder="选择起点实体">
            {state.entities.map((e) => {
              const type = state.entityTypes.find((t) => t.id === e.typeId);
              return (
                <Select.Option key={e.id} value={e.id}>
                  <Space>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: type?.color || '#ccc',
                      }}
                    />
                    {e.label}
                  </Space>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="target"
          label="终点实体"
          rules={[{ required: true, message: '请选择终点' }]}
        >
          <Select showSearch optionFilterProp="children" placeholder="选择终点实体">
            {state.entities.map((e) => {
              const type = state.entityTypes.find((t) => t.id === e.typeId);
              return (
                <Select.Option key={e.id} value={e.id}>
                  <Space>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: type?.color || '#ccc',
                      }}
                    />
                    {e.label}
                  </Space>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="typeId"
          label="关系类型"
          rules={[{ required: true, message: '请选择关系类型' }]}
        >
          <Select>
            {state.relationTypes.map((type) => (
              <Select.Option key={type.id} value={type.id}>
                <Space>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 3,
                      backgroundColor: type.color,
                    }}
                  />
                  {type.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="label" label="标签">
          <Input placeholder="关系描述（可选）" />
        </Form.Item>
        <Form.Item name="directed" label="有向关系" valuePropName="checked">
          <Switch />
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

export default AddEdgeModal;
