/*
 * File: FuaRouteHelper.ts
 * Created Date: Aug 18, 2021
 * Copyright (c) 2021 Zeytech Inc. (https://zeytech.com)
 * Author: Steve Krenek (https://github.com/skrenek)
 * -----
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// import { Router } from '@adonisjs/http-server/build/standalone'
import { Route } from '@adonisjs/http-server/build/src/Router/Route'
import { RouteGroup } from '@adonisjs/http-server/build/src/Router/Group'
import { RouteResource } from '@adonisjs/http-server/build/src/Router/Resource'

export class FuaRouteHelper {
  public static getRoute(routes: any[], routeName: string): Route | undefined {
    let result: Route | undefined
    for (const item of routes) {
      // @ts-ignore
      if (item.hasOwnProperty('routes') && Array.isArray(item.routes)) {
        const group = item as RouteGroup | RouteResource

        if (group.routes.length) {
          result = this.search(routeName, group.routes)
          if (result) {
            return result
          }
        }
        // @ts-ignore
      } else if (item.name === routeName) {
        return item as Route
      }
    }
  }

  public static getRouteGroup(routes: any[]): RouteGroup | undefined {
    for (const item of routes) {
      if (item.hasOwnProperty('routes') && Array.isArray(item.routes)) {
        const group = item as RouteGroup | RouteResource
        let name = ''
        // @ts-ignore
        if (group.routes.length && group.routes[0].name) {
          // @ts-ignore
          name = group.routes[0].name
        }
        if (name && name.indexOf('fua') === 0) {
          return group as RouteGroup
        }
      }
    }
  }

  private static search(routeName: string, routes: any[]): Route | undefined {
    for (const item of routes) {
      if (item.name === routeName) {
        return item as Route
      }
    }
  }
}
