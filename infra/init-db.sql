-- init-db.sql
-- Creates the dev tenant database on first Docker Compose startup
-- This runs automatically via docker-entrypoint-initdb.d

CREATE DATABASE tenant_db;
