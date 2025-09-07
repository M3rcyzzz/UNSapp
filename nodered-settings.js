module.exports = {
    // 编辑器设置
    uiPort: process.env.PORT || 1880,
    uiHost: "0.0.0.0",
    
    // 管理界面路径
    httpAdminRoot: '/eventflow',
    httpNodeRoot: '/eventflow/api',
    
    // 用户目录
    userDir: './nodered-data',
    
    // 节点目录
    nodesDir: './nodered-nodes',
    
    // 日志设置
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },
    
    // 编辑器设置
    editorTheme: {
        projects: {
            enabled: false
        }
    },
    
    // 函数全局上下文
    functionGlobalContext: {
        // 可以在这里添加全局变量
        os: require('os'),
    },
    
    // 安全设置
    adminAuth: {
        type: "credentials",
        users: [{
            username: "admin",
            password: "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN.",
            permissions: "*"
        }]
    },
    
    // 上下文存储
    contextStorage: {
        default: {
            module: "localfilesystem"
        }
    },
    
    // 导出设置
    exportGlobalContextKeys: false,
    
    // 外部模块
    externalModules: {
        autoInstall: false
    }
};
