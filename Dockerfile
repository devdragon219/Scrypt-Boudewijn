FROM mwaeckerlin/nodejs-build AS build
ENV NX_DAEMON false
USER root
RUN $PKG_INSTALL jq
USER ${BUILD_USER}
COPY --chown=${BUILD_USER} frontends/package.json frontends/
COPY --chown=${BUILD_USER} backends/package.json backends/
COPY --chown=${BUILD_USER} package.json package-lock.json nx.json tsconfig.json tsconfig.nest.json tsconfig.react.json ./
COPY --chown=${BUILD_USER} libs libs
COPY --chown=${BUILD_USER} auxiliary/nest-templates auxiliary/nest-templates
RUN npm install
# bugfix: in alpine, nx dependencies seem buggy
RUN npx nx run-many --target=clean --projects=$(jq '.name' libs/*/package.json | tr '\n' ',')
RUN npx nx run-many --verbose --skipNxCache --nxIgnoreCycles --parallel 1 --target=build --projects=@scrypt-swiss/nest-templates,$(jq '.name' libs/*/package.json | tr '\n' ',')
