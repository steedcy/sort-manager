package com.sort.manager.book;
public class BookServiceUnavailableException extends RuntimeException { public BookServiceUnavailableException() { super("图书信息服务暂时不可用，你可以稍后重试或手动填写"); } public BookServiceUnavailableException(Throwable cause) { super("图书信息服务暂时不可用，你可以稍后重试或手动填写", cause); } }
