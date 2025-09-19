import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

export interface MqttConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId?: string;
  topicPrefix?: string;
}

export interface MqttStats {
  connected: boolean;
  messageCount: number;
  topics: Map<string, number>; // topic -> message count
  topicPayloads: Map<string, string>; // topic -> latest payload
  lastMessage?: {
    topic: string;
    timestamp: Date;
    payload: string;
  };
}

export interface MqttConnection {
  client: MqttClient | null;
  stats: MqttStats;
  connect: (config: MqttConfig) => Promise<void>;
  disconnect: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
}

export const useMqtt = (): MqttConnection => {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [stats, setStats] = useState<MqttStats>({
    connected: false,
    messageCount: 0,
    topics: new Map(),
    topicPayloads: new Map(),
  });
  
  const statsRef = useRef<MqttStats>(stats);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update stats ref when stats change
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const connect = useCallback(async (config: MqttConfig) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Disconnect existing client if any
        if (client) {
          client.end();
        }

        const options = {
          clientId: config.clientId || `uns-browser-${Math.random().toString(16).substr(2, 8)}`,
          username: config.username,
          password: config.password,
          clean: true,
          reconnectPeriod: 5000,
          connectTimeout: 30 * 1000,
          // Add WebSocket path support
          path: config.brokerUrl.includes('/mqtt') ? '/mqtt' : undefined,
        };

        const mqttClient = mqtt.connect(config.brokerUrl, options);

        mqttClient.on('connect', () => {
          console.log('MQTT Connected');
          setStats(prev => ({
            ...prev,
            connected: true,
          }));

          // Subscribe to UNS topics
          const unsTopic = config.topicPrefix ? `${config.topicPrefix}/#` : 'v1/#';
          mqttClient.subscribe(unsTopic, (err) => {
            if (err) {
              console.error('MQTT Subscribe error:', err);
            } else {
              console.log(`Subscribed to ${unsTopic}`);
            }
          });
          
          setClient(mqttClient);
          resolve();
        });

      mqttClient.on('message', (topic, message) => {
        const messageStr = message.toString();
        const now = new Date();
        
        setStats(prev => {
          const newTopics = new Map(prev.topics);
          const newTopicPayloads = new Map(prev.topicPayloads);
          const currentCount = newTopics.get(topic) || 0;
          newTopics.set(topic, currentCount + 1);
          newTopicPayloads.set(topic, messageStr);

          return {
            ...prev,
            messageCount: prev.messageCount + 1,
            topics: newTopics,
            topicPayloads: newTopicPayloads,
            lastMessage: {
              topic,
              timestamp: now,
              payload: messageStr,
            },
          };
        });
      });

        mqttClient.on('error', (err) => {
          console.error('MQTT Error:', err);
          setStats(prev => ({
            ...prev,
            connected: false,
          }));
          reject(new Error(`MQTT connection failed: ${err.message}`));
        });

        mqttClient.on('close', () => {
          console.log('MQTT Disconnected');
          setStats(prev => ({
            ...prev,
            connected: false,
          }));
        });

        // Set a timeout for connection
        setTimeout(() => {
          if (!mqttClient.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 30000);

      } catch (error) {
        console.error('MQTT Connection failed:', error);
        reject(error);
      }
    });
  }, [client]);

  const disconnect = useCallback(() => {
    if (client) {
      client.end();
      setClient(null);
      setStats({
        connected: false,
        messageCount: 0,
        topics: new Map(),
        topicPayloads: new Map(),
      });
    }
  }, [client]);

  const subscribe = useCallback((topic: string) => {
    if (client && client.connected) {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    }
  }, [client]);

  const unsubscribe = useCallback((topic: string) => {
    if (client && client.connected) {
      client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to unsubscribe from ${topic}:`, err);
        } else {
          console.log(`Unsubscribed from ${topic}`);
        }
      });
    }
  }, [client]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        client.end();
      }
      const timeoutId = reconnectTimeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [client]);

  return {
    client,
    stats,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
};
