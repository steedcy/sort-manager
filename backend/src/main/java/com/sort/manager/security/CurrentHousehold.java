package com.sort.manager.security;

/**
 * Authenticated identity boundary used by business services. Keeping this as an
 * interface makes household scoping explicit and easy to test without a live JWT.
 */
public interface CurrentHousehold {

    Long requireHouseholdId();

    Long requireUserId();
}
