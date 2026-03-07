#!/usr/bin/env python3
# Script to track Notion data extraction results
# Data will be populated via browser tool

CHARACTERS_DATA = {}

NOTION_URLS = {
    "amanda": "https://www.notion.so/Amanda-2cbd0d770d028008b082daeee86eb025",
    "arturo": "https://www.notion.so/Arturo-2cbd0d770d028050b588fc5b5d16e288",
    "gerardo": "https://www.notion.so/Gerardo-2cbd0d770d028017b7d6cdecfcf2b76d",
    "carlo": "https://www.notion.so/Carlo-2cbd0d770d02807aa8a6f9fe379b020f",
    "chris": "https://www.notion.so/Chris-2cbd0d770d02804087eccdadba738540",
    "dani": "https://www.notion.so/Dani-2cbd0d770d02806caf61ea2939fa390d",
    "esteban": "https://www.notion.so/Esteban-2cbd0d770d02807d9c93fe396fc8dcd4",
    "francisco": "https://www.notion.so/Francisco-2cbd0d770d028006879ceac96ecdece9",
    "gabo": "https://www.notion.so/Gabo-2cbd0d770d0280ea968de985b265ebd3",
    "geri": "https://www.notion.so/Geri-2cbd0d770d02806d879ed1164f3430e3",
    "herbert": "https://www.notion.so/Herbert-2cbd0d770d02802c9338cbf112b56237",
    "jaime": "https://www.notion.so/Jaime-2cbd0d770d028030b8e7d3e73722f316",
    "javier": "https://www.notion.so/Javier-2cbd0d770d02800b98ffe3d006f7af5f",
    "andy": "https://www.notion.so/Andy-315d0d770d0280be8f87f63e9c1a1917",
    "karen": "https://www.notion.so/Karen-2cbd0d770d02800094e9eed44097e184",
    "kevin": "https://www.notion.so/Kevin-2cbd0d770d0280cda171f5b1fa72f1c5",
    "lorens": "https://www.notion.so/Lorens-2cbd0d770d028030916edc502f69ec99",
    "max": "https://www.notion.so/Max-2cbd0d770d02808388f3e0292fa2c13f",
    "nelson": "https://www.notion.so/Nelson-2cbd0d770d0280d9b334d8e8ef6afbe3",
    "yong": "https://www.notion.so/Yong-2cbd0d770d0280bea1f2f47597e34767",
    "radarin": "https://www.notion.so/Radar-n-2cbd0d770d02802d90dbd8aa0b8888b8",
    "andres": "https://www.notion.so/Andr-s-2fed0d770d0280e39d55c6b62996bf3d",
    "hector": "https://www.notion.so/H-ctor-31ad0d770d028013adf9e56ddeb3bdff",
}
