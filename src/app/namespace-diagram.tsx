"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Node } from './page';

interface NamespaceDiagramProps {
  data: Node;
  width?: number;
  height?: number;
  search?: string;
}

interface D3Node extends d3.HierarchyNode<Node> {
  x?: number;
  y?: number;
}

export const NamespaceDiagram: React.FC<NamespaceDiagramProps> = ({ 
  data, 
  width = 800, 
  height = 600,
  search = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // 清除之前的图表
    d3.select(svgRef.current).selectAll("*").remove();

    // 创建工具提示
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "namespace-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("z-index", "1000")
      .style("pointer-events", "none")
      .style("max-width", "300px");

    // 创建SVG容器
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#fafafa")
      .style("border-radius", "8px");

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // 创建主容器组
    const container = svg.append("g");

    // 创建层次结构数据
    const root = d3.hierarchy(data);
    
    // 计算树形布局 - 增加节点间距
    const treeLayout = d3.tree<Node>()
      .size([height - 150, width - 300]) // 增加边距，给节点更多空间
      .separation((a, b) => {
        // 增加叶子节点之间的间距
        if (!a.children && !b.children) {
          return 3; // 叶子节点间距更大
        }
        return 1.5; // 普通节点间距也增加
      });

    treeLayout(root);

    // 获取所有节点和链接
    const nodes = root.descendants();
    const links = root.links();

    // 创建链接
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<Node>, D3Node>()
        .x(d => d.y! + 150) // 调整链接位置
        .y(d => d.x! + 75))
      .style("fill", "none")
      .style("stroke", "#94a3b8")
      .style("stroke-width", 2)
      .style("opacity", 0.7);

    // 创建节点组
    const nodeGroup = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.y! + 150}, ${d.x! + 75})`) // 调整位置以适应新的布局
      .style("cursor", "pointer");

    // 添加节点圆圈 - 增大叶子节点
    nodeGroup.append("circle")
      .attr("r", d => {
        if (d.data.type) return 12; // 叶子节点更大
        if (d.children) return 16; // 有子节点的内部节点
        return 10; // 其他节点
      })
      .style("fill", d => {
        if (d.data.type === "metrics") return "#6366f1"; // indigo
        if (d.data.type === "state") return "#10b981"; // green
        if (d.data.type === "action") return "#f59e0b"; // amber
        return "#6b7280"; // gray for non-leaf nodes
      })
      .style("stroke", "#ffffff")
      .style("stroke-width", 2)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

    // 添加节点标签 - 优化叶子节点显示
    nodeGroup.append("text")
      .attr("dy", d => d.data.type ? "3em" : "2.5em") // 叶子节点标签位置更低
      .attr("text-anchor", "middle")
      .style("font-size", d => d.data.type ? "11px" : "12px") // 叶子节点字体稍小
      .style("font-weight", d => d.data.type ? "600" : "500")
      .style("fill", d => {
        // 高亮搜索匹配的节点
        if (search && (d.data.name.toLowerCase().includes(search.toLowerCase()) || 
                      d.data.path.toLowerCase().includes(search.toLowerCase()))) {
          return "#dc2626"; // red for search matches
        }
        return "#374151";
      })
      .text(d => d.data.name)
      .each(function(d) {
        // 处理长文本换行 - 优化叶子节点文本显示
        const text = d3.select(this);
        const words = d.data.name.split(/(?=[A-Z])/);
        if (words.length > 1) {
          text.text(null);
          words.forEach((word, i) => {
            text.append("tspan")
              .attr("x", 0)
              .attr("dy", i === 0 ? "0" : "1.1em")
              .text(word);
          });
        }
      });

    // 添加类型标签（仅对叶子节点）
    nodeGroup.filter(d => !!d.data.type)
      .append("text")
      .attr("dy", "4.5em") // 调整位置，避免重叠
      .attr("text-anchor", "middle")
      .style("font-size", "9px") // 稍微小一点
      .style("fill", d => {
        if (d.data.type === "metrics") return "#6366f1";
        if (d.data.type === "state") return "#10b981";
        if (d.data.type === "action") return "#f59e0b";
        return "#6b7280";
      })
      .text(d => d.data.type);

    // 添加MPS信息（如果有）
    nodeGroup.filter(d => d.data.type && d.data.estMps)
      .append("text")
      .attr("dy", "6em") // 调整位置
      .attr("text-anchor", "middle")
      .style("font-size", "8px") // 更小的字体
      .style("fill", "#6b7280")
      .text(d => `${d.data.estMps!.toFixed(3)} msg/s`);

    // 添加点击事件 - 不重置视角
    nodeGroup.on("click", (event, d) => {
      setSelectedNode(d.data);
      
      // 高亮选中的节点
      nodeGroup.selectAll("circle")
        .style("stroke-width", 2)
        .style("stroke", "#ffffff");
      
      d3.select(event.currentTarget).select("circle")
        .style("stroke-width", 4)
        .style("stroke", "#3b82f6");
      
      // 不重置视角，保持当前的缩放和平移状态
    });

    // 添加悬停效果和工具提示
    nodeGroup.on("mouseover", function(event, d) {
      d3.select(this).select("circle")
        .style("stroke-width", 3)
        .style("stroke", "#3b82f6");
      
      // 显示工具提示
      tooltip.style("visibility", "visible")
        .html(`
          <div><strong>${d.data.name}</strong></div>
          <div style="margin-top: 4px; font-size: 11px; opacity: 0.9;">${d.data.path}</div>
          ${d.data.type ? `<div style="margin-top: 4px;"><span style="background: ${d.data.type === 'metrics' ? '#6366f1' : d.data.type === 'state' ? '#10b981' : '#f59e0b'}; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${d.data.type}</span></div>` : ''}
          ${d.data.estMps ? `<div style="margin-top: 4px; font-size: 11px;">${d.data.estMps.toFixed(3)} msg/s</div>` : ''}
          ${d.data.description ? `<div style="margin-top: 4px; font-size: 11px; opacity: 0.9;">${d.data.description}</div>` : ''}
        `);
    })
    .on("mousemove", function(event) {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function(event, d) {
      if (selectedNode?.id !== d.data.id) {
        d3.select(this).select("circle")
          .style("stroke-width", 2)
          .style("stroke", "#ffffff");
      }
      tooltip.style("visibility", "hidden");
    });

    // 初始缩放和居中 - 只在数据变化时执行
    const bounds = container.node()?.getBBox();
    if (bounds) {
      const fullWidth = width;
      const fullHeight = height;
      const widthScale = fullWidth / bounds.width;
      const heightScale = fullHeight / bounds.height;
      const scale = Math.min(widthScale, heightScale) * 0.7; // 稍微缩小一点，给节点更多空间
      const translate = [
        (fullWidth - bounds.width * scale) / 2 - bounds.x * scale,
        (fullHeight - bounds.height * scale) / 2 - bounds.y * scale
      ];
      
      // 使用setTimeout确保DOM更新完成后再执行缩放
      setTimeout(() => {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      }, 100);
    }

    // 清理函数
    return () => {
      d3.selectAll(".namespace-tooltip").remove();
    };

  }, [data, width, height, selectedNode, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 tracking-wide">Namespace 关系图</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>metrics</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>state</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>action</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>folder</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <svg ref={svgRef} className="w-full"></svg>
      </div>
      
      {selectedNode && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">选中节点详情</h4>
          <div className="space-y-2 text-xs text-blue-700">
            <div>
              <span className="font-medium">路径:</span> 
              <code className="ml-1 bg-blue-100 px-1 rounded">{selectedNode.path}</code>
            </div>
            {selectedNode.type && (
              <div>
                <span className="font-medium">类型:</span> 
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-100 text-blue-700 border-blue-200">
                  {selectedNode.type}
                </span>
              </div>
            )}
            {selectedNode.estMps && (
              <div>
                <span className="font-medium">消息速率:</span> 
                <span className="ml-1 font-mono">{selectedNode.estMps.toFixed(3)} msg/s</span>
              </div>
            )}
            {selectedNode.description && (
              <div>
                <span className="font-medium">描述:</span> 
                <span className="ml-1">{selectedNode.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
