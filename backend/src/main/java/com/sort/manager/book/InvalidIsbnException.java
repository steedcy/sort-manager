package com.sort.manager.book;

public class InvalidIsbnException extends IllegalArgumentException {
    public InvalidIsbnException() {
        super("该条码不是有效的图书 ISBN");
    }
}
