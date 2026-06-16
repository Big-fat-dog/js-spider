"""
WebSocket 日志服务器
浏览器端通过 WebSocket 保持长连接，顺序发送日志
批量写入优化：减少 IO 次数
"""
import asyncio
import websockets
import os
from datetime import datetime

LOG_FILE = "vm_logs.txt"
BATCH_SIZE = 100  # 每 100 条批量写入一次

# 清空旧日志
if os.path.exists(LOG_FILE):
    os.remove(LOG_FILE)

connected_clients = set()
total_received = 0

async def handle_log(websocket):
    """新版 websockets API：handler 只接收 websocket 参数"""
    global total_received  # 声明使用全局变量
    connected_clients.add(websocket)
    print(f"[连接] 客户端已连接，当前连接数: {len(connected_clients)}")

    batch = []

    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            async for message in websocket:
                batch.append(message)
                total_received += 1

                # 每 BATCH_SIZE 条批量写入
                if len(batch) >= BATCH_SIZE:
                    f.write('\n'.join(batch) + '\n')
                    f.flush()
                    batch = []
                    print(f"[写入] 已接收: {total_received} 条")

                # 发送确认
                await websocket.send("ok")

            # 连接关闭前，写入剩余日志
            if batch:
                f.write('\n'.join(batch) + '\n')
                f.flush()
                print(f"[最后写入] 剩余 {len(batch)} 条")

    except websockets.exceptions.ConnectionClosed:
        # 断开时也要写入剩余日志
        if batch:
            with open(LOG_FILE, 'a', encoding='utf-8') as f:
                f.write('\n'.join(batch) + '\n')
                f.flush()
            print(f"[断开写入] 剩余 {len(batch)} 条")
        print(f"[断开] 客户端断开连接")
    finally:
        connected_clients.discard(websocket)
        print(f"[统计] 总接收: {total_received} 条, 已写入文件: {LOG_FILE}")

async def main():
    print(f"WebSocket 日志服务器启动: ws://127.0.0.1:9999")
    print(f"日志文件: {LOG_FILE}")
    print(f"批量写入: 每 {BATCH_SIZE} 条写入一次")
    print("Ctrl+C 停止服务器")

    async with websockets.serve(handle_log, "127.0.0.1", 9999):
        await asyncio.Future()  # 永久运行

if __name__ == '__main__':
    asyncio.run(main())