# MQTT 快速测试指南

## 🚀 立即测试步骤

### 1. 刷新页面
由于我们更新了代码，请刷新浏览器页面（Ctrl+F5 或 Cmd+Shift+R）

### 2. 使用推荐的broker
现在默认使用 **HiveMQ公共broker**，这是最稳定的选择：
- **URL**: `wss://broker.hivemq.com:8884/mqtt`
- **特点**: 无需认证，稳定可靠

### 3. 测试连接
1. 点击 **"Connect"** 按钮
2. 观察控制台日志
3. 应该看到：
   ```
   Attempting to connect with config: Object
   Broker URL: wss://broker.hivemq.com:8884/mqtt
   Topic prefix: v1
   MQTT Connected
   Subscribed to v1/#
   ```

### 4. 如果连接成功
- 状态显示 "Connected"
- 按钮变为 "Disconnect"
- 控制台显示 "MQTT Connected"

### 5. 测试消息接收
使用MQTT客户端工具（如MQTT Explorer）连接到同一个broker：
- **Broker**: `broker.hivemq.com`
- **Port**: `8884`
- **Protocol**: WebSocket
- **Path**: `/mqtt`

发布测试消息到主题：`v1/test/hello`

## 🔧 如果仍然失败

### 尝试其他broker：
1. 点击 "Config" 按钮
2. 尝试不同的测试broker：
   - **test.mosquitto.org** (Mosquitto)
   - **localhost:1883** (如果本地有Mosquitto)

### 检查网络：
- 确保网络连接正常
- 检查是否有防火墙阻止WebSocket连接
- 尝试使用VPN（如果网络有限制）

### 启用详细调试：
控制台已经自动启用了MQTT调试日志，刷新页面后会有更详细的连接信息。

## 📊 预期结果

连接成功后，您应该看到：
- ✅ 连接状态：Connected
- ✅ 按钮状态：Disconnect
- ✅ 控制台日志：MQTT Connected
- ✅ 订阅成功：Subscribed to v1/#

## 🎯 下一步

连接成功后，您可以：
1. 使用MQTT客户端发布消息到 `v1/#` 主题
2. 观察浏览器中的实时消息统计
3. 查看namespace tree的实时更新
4. 测试不同的topic类型（state, action, metrics）

现在请刷新页面并重新测试连接！
