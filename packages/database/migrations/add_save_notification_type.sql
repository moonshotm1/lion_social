-- Run this in the Supabase SQL Editor to add the 'save' notification type.
-- This is required for save/favorite notifications to work.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'save';
