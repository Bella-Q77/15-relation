#!/bin/bash
# NeuroDB 嵌入式安装脚本
# 将 NeuroDB 服务器二进制文件安装到应用数据目录

set -e

INSTALL_DIR="$HOME/.relationship-analyzer/neurodb"
BIN_DIR="$INSTALL_DIR/bin"

echo "========================================"
echo "  NeuroDB 嵌入式安装"
echo "========================================"
echo ""
echo "安装目录: $INSTALL_DIR"
echo ""

mkdir -p "$BIN_DIR"
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/logs"
mkdir -p "$INSTALL_DIR/import"

OS=$(uname -s)
ARCH=$(uname -m)

echo "系统: $OS ($ARCH)"
echo ""

if [ -f "$BIN_DIR/NEURO_SERVER" ]; then
    echo "✓ NEURO_SERVER 已存在: $BIN_DIR/NEURO_SERVER"
    echo ""
    echo "如需更新，请手动替换该文件。"
    exit 0
fi

echo "请按以下方式获取 NeuroDB 二进制文件："
echo ""
echo "方式一：Docker 提取（推荐）"
echo "  docker pull pangguoming/neurodb:1.0.0"
echo "  docker create --name neurodb-tmp pangguoming/neurodb:1.0.0"
echo "  docker cp neurodb-tmp:/neurodb/bin/NEURO_SERVER $BIN_DIR/"
echo "  docker rm neurodb-tmp"
echo ""
echo "方式二：官网下载"
echo "  访问 https://neurodb.org/download.html"
echo "  下载对应系统版本，解压后将 bin/NEURO_SERVER 复制到:"
echo "  $BIN_DIR/"
echo ""
echo "方式三：手动放置"
echo "  将 NEURO_SERVER 可执行文件复制到: $BIN_DIR/"
echo ""

if command -v docker &> /dev/null; then
    echo "检测到 Docker，是否自动通过 Docker 提取？[y/N]"
    read -r answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo "正在拉取 NeuroDB 镜像..."
        docker pull pangguoming/neurodb:1.0.0

        echo "正在提取 NEURO_SERVER 二进制..."
        docker create --name neurodb-tmp pangguoming/neurodb:1.0.0
        docker cp neurodb-tmp:/neurodb/bin/NEURO_SERVER "$BIN_DIR/" 2>/dev/null || \
        docker cp neurodb-tmp:/app/bin/NEURO_SERVER "$BIN_DIR/" 2>/dev/null || \
        docker cp neurodb-tmp:/usr/local/bin/NEURO_SERVER "$BIN_DIR/" 2>/dev/null || {
            echo ""
            echo "自动提取失败，尝试查找文件位置..."
            docker export neurodb-tmp | tar t 2>/dev/null | grep -i neuro | head -20
            docker rm neurodb-tmp
            echo ""
            echo "请手动从 Docker 容器中提取 NEURO_SERVER 文件。"
            exit 1
        }
        docker rm neurodb-tmp

        chmod +x "$BIN_DIR/NEURO_SERVER"
        echo ""
        echo "✓ 安装成功！"
        echo "  $BIN_DIR/NEURO_SERVER"
    fi
else
    echo "未检测到 Docker，请手动安装。"
fi

echo ""
echo "安装完成后，重启关系分析平台即可自动启用 NeuroDB。"
