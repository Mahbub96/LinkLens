CREATE DATABASE IF NOT EXISTS linklens;

CREATE TABLE IF NOT EXISTS linklens.click_events (
    event_id UUID,
    link_id UUID,
    workspace_id UUID,
    timestamp DateTime64(3, 'UTC'),

    -- Network Telemetry
    ip_address String,
    country LowCardinality(String),
    region String,
    city String,
    asn UInt32,
    isp String,
    is_vpn UInt8,
    is_tor UInt8,
    is_proxy UInt8,

    -- Hardware & Client
    user_agent String,
    device LowCardinality(String),
    browser LowCardinality(String),
    browser_version String,
    os LowCardinality(String),
    screen_resolution LowCardinality(String),
    hardware_concurrency UInt8,
    device_memory Float32,
    hardware_signature String,
    timezone String,
    timezone_mismatch UInt8,

    -- Attribution & Context
    referrer String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    utm_term String,
    utm_content String,

    -- Quality Score
    traffic_score UInt8,
    is_bot UInt8
) ENGINE = MergeTree()
ORDER BY (workspace_id, link_id, toYYYYMM(timestamp), timestamp)
TTL timestamp + INTERVAL 365 DAY;
