# Solid Community Inbox

This service accepts Join and Leave activity sent by an authenticated person, validates the request, and adds or removes them from the given community accordingly. The inbox can be linked from community's URI by [`ldp:inbox`](http://www.w3.org/ns/ldp#inbox) predicate. It may also do some other membership tasks (or not).

## How it works

- It's an agent with its own webId, and it needs read and write access to the community Solid pod.
- It runs on a server.
- It has an `/inbox` endpoint.
- When you POST a `Join` activity to the inbox, it validates that agent, object, and authenticated person all match; and possibly check other conditions. (Invite only, temporary joining, ...). If conditions are met, it adds the person's webId to one of the community groups.
- When you POST a `Leave` activity to the inbox, it validates that agent, object, and authenticated person all match, and remove the person from the community groups.
- It may also support invite-only communities, or admin reviews.
- It may also regularly remove members who haven't validated their email (or not)

## Usage

### Configure

Copy `.env.sample` to `.env` and edit the latter according to your needs.

_:warning: If you provide URIs with `#``, put them to `""`, otherwise # may be interpreted as comment!_

Alternatively, you may provide the configuration as environment variables

You can find full list of config options in [.env.sample](./.env.sample)

### Run

Install for production:

```sh
yarn install --frozen-lockfile --production
```

Run:

```sh
yarn start
```

### Use

Service API is documented in [OpenAPI schema](./apidocs/openapi.json) (still work in progress). When you run the app with `yarn start`, you'll see the Swagger-UI documentation at `/`.

## Tests

Install for development:

```sh
yarn install --frozen-lockfile
```

Run:

```sh
yarn test
```

Tests are placed in [src/test/](./src/test/)

## TODO

TODO

## License

MIT
