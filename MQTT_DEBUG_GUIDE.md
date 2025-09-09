# MQTT 连接调试指南

## 🔍 问题诊断

如果您点击Connect按钮没有反应，请按照以下步骤进行调试：

### 1. 检查浏览器控制台
打开浏览器开发者工具（F12），查看Console标签页是否有错误信息：

```javascript
// 应该看到这些日志：
Attempting to connect with config: {brokerUrl: "wss://test.mosquitto.org:8081", ...}
MQTT Connected
Subscribed to v1/#
```

### 2. 常见错误和解决方案

#### 错误：`WebSocket connection failed`
**原因**: Broker不支持WebSocket或URL错误
**解决方案**: 
- 确保使用WebSocket URL（ws:// 或 wss://）
- 尝试不同的测试broker

#### 错误：`Connection timeout`
**原因**: 网络问题或broker不可达
**解决方案**:
- 检查网络连接
- 尝试其他broker

#### 错误：`CORS policy`
**原因**: 浏览器安全策略阻止连接
**解决方案**:
- 使用支持CORS的broker
- 尝试HTTPS broker（wss://）

### 3. 测试步骤

#### 步骤1: 使用公共测试broker
1. 点击"Config"按钮
2. 点击"test.mosquitto.org (Public test broker)"
3. 点击"Connect"
4. 查看控制台日志

#### 步骤2: 检查连接状态
连接成功后应该看到：
- 状态显示"Connected"
- 按钮变为"Disconnect"
- 控制台显示"MQTT Connected"

#### 步骤3: 测试消息接收
1. 使用MQTT客户端工具（如MQTT Explorer）连接到同一个broker
2. 发布消息到 `v1/test/topic`
3. 在浏览器中应该看到消息统计更新

### 4. 推荐的测试broker

| Broker | URL | 说明 |
|--------|-----|------|
| test.mosquitto.org | `wss://test.mosquitto.org:8081` | 公共测试broker，无需认证 |
| EMQX Public | `wss://broker.emqx.io:8083/mqtt` | EMQX公共broker |
| 本地Mosquitto | `ws://localhost:1883` | 需要本地安装Mosquitto |

### 5. 本地Mosquitto安装（可选）

如果您想使用本地broker：

#### Windows:
```bash
# 使用Chocolatey
choco install mosquitto

# 或下载安装包
# https://mosquitto.org/download/
```

#### 启动Mosquitto:
```bash
# 启用WebSocket支持
mosquitto -c mosquitto.conf
```

#### mosquitto.conf配置:
```
listener 1883
protocol mqtt

listener 8083
protocol websockets
```

### 6. 调试技巧

#### 启用详细日志
在浏览器控制台中运行：
```javascript
// 查看MQTT连接状态
console.log('Current stats:', window.mqttStats);

// 手动测试连接
window.testMqttConnection = async () => {
  const mqtt = await import('mqtt');
  const client = mqtt.connect('wss://test.mosquitto.org:8081');
  
  client.on('connect', () => {
    console.log('Direct connection successful');
    client.end();
  });
  
  client.on('error', (err) => {
    console.error('Direct connection failed:', err);
  });
};
```

#### 网络检查
```bash
# 测试broker连通性
ping test.mosquitto.org

# 测试WebSocket端口
telnet test.mosquitto.org 8081
```

### 7. 故障排除清单

- [ ] 浏览器控制台是否有错误？
- [ ] 网络连接是否正常？
- [ ] 使用的broker URL是否正确？
- [ ] broker是否支持WebSocket？
- [ ] 是否有防火墙阻止连接？
- [ ] 是否使用了正确的协议（ws:// 或 wss://）？

### 8. 如果仍然无法连接

1. **尝试不同的broker**
2. **检查网络环境**（公司网络可能有代理限制）
3. **使用VPN**（如果网络有限制）
4. **检查浏览器版本**（确保支持WebSocket）

## 🎯 预期行为

连接成功后，您应该看到：

1. **连接状态**: "Connected" 绿色指示
2. **按钮变化**: "Connect" → "Disconnect"
3. **控制台日志**: "MQTT Connected" 和 "Subscribed to v1/#"
4. **实时数据**: 如果有消息发布到v1/#主题，会看到统计更新

## 📞 获取帮助

如果按照以上步骤仍然无法连接，请提供：
1. 浏览器控制台的完整错误信息
2. 使用的broker URL
3. 网络环境描述
4. 浏览器版本信息
